"""
api_bridge.py — FastAPI bridge between Next.js frontend and OMEGA Python core.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, Request, Response, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import json
import asyncio
import threading
import time
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Queue worker is started on app startup (see startup_event)

from core.scheduler_engine import SchedulerEngine
app = FastAPI(title="MailBlast OMEGA API", version="1.0.3")

# Pre-initialize scheduler globally but lazily
scheduler_engine = None

@app.get("/")
async def root_health():
    return {"status": "healthy", "engine": "MailBlast OMEGA", "version": "1.0.3"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://mailblast-omega-khaki.vercel.app",
        "https://mailblast-omega-omega.vercel.app",
        "https://mailblast-omega.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Incoming {request.method} {request.url}")
    response = await call_next(request)
    print(f"DEBUG: Response status {response.status_code}")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    # Log the full exception for debugging
    import traceback
    traceback.print_exc()
    
    # Return 500 with CORS headers
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": error_msg},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*")
        }
    )

@app.middleware("http")
async def register_sender_ip_and_user_id(request: Request, call_next):
    from data.db import get_db, current_user_id
    
    uid = request.headers.get("x-user-id")
    print(f"DEBUG: Request {request.url.path} | X-User-Id: {uid}")
    token = current_user_id.set(uid)
    
    try:
        # Register IP for all management API calls (not tracking)
        if not request.url.path.startswith("/api/t/o/"):
            ip = request.client.host if request.client else None
            ua = request.headers.get('user-agent', '')
            if ip:
                get_db().register_internal_ip(ip, ua)
        
        response = await call_next(request)
        return response
    finally:
        current_user_id.reset(token)

main_loop = None
async def trash_cleanup_loop():
    from data.db import cleanup_expired_trash
    import asyncio
    while True:
        try:
            cleanup_expired_trash()
            print("TRASH: Running 7-day expiration cleanup...")
        except Exception as e:
            print(f"TRASH ERROR: {e}")
        await asyncio.sleep(86400) # Wait 24 hours

@app.on_event("startup")
async def startup_event():
    global main_loop
    import asyncio
    main_loop = asyncio.get_running_loop()
    
    # Start the robust sequential queue worker
    queue_worker.start()

    # Start trash auto-cleanup daemon
    main_loop.create_task(trash_cleanup_loop())

def sync_broadcast(event: dict):
    if main_loop and main_loop.is_running():
        import asyncio
        asyncio.run_coroutine_threadsafe(broadcast_log_event(event), main_loop)

# ── Sequential Queue Worker (Blazing Speed + Consistent Pacing) ──────
import threading
import time
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
import queue

class SMTPConnectionPool:
    """Thread-safe SMTP connection pool using LifoQueue."""
    def __init__(self, max_connections_per_account=20):
        self.pools = {}  # account_id -> queue.LifoQueue
        self.max_connections = max_connections_per_account
        self.lock = threading.Lock()

    def get_connection(self, acc):
        account_id = acc['id']
        
        with self.lock:
            if account_id not in self.pools:
                self.pools[account_id] = queue.LifoQueue(maxsize=self.max_connections)

        q = self.pools[account_id]
        
        try:
            # Try to get an idle connection
            server = q.get_nowait()
            try:
                code, _ = server.noop()
                if code == 250:
                    return server
            except Exception:
                pass
            # Connection is dead, close it and fall through to create a new one
            try: server.quit()
            except: pass
        except queue.Empty:
            pass

        # Create new connection
        import smtplib
        from core.credential_vault import decrypt_password
        raw_pwd = decrypt_password(acc['encrypted_pass'])
        pwd = raw_pwd.replace(' ', '').replace('\xa0', '').strip()
        smtp_port = int(acc.get('smtp_port') or 587)
        smtp_host = acc.get('smtp_host', 'smtp.gmail.com')

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=30)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=30)
            server.starttls()

        server.login(acc['email'], pwd)
        return server

    def release_connection(self, account_id, server):
        if not server: return
        with self.lock:
            q = self.pools.get(account_id)
            
        if q is not None:
            try:
                q.put_nowait(server)
            except queue.Full:
                try: server.quit()
                except: pass
        else:
            try: server.quit()
            except: pass

    def close_all(self, account_id=None):
        with self.lock:
            if account_id is not None:
                q = self.pools.pop(account_id, None)
                if q:
                    while not q.empty():
                        try: server = q.get_nowait(); server.quit()
                        except: pass
            else:
                for aid, q in list(self.pools.items()):
                    while not q.empty():
                        try: server = q.get_nowait(); server.quit()
                        except: pass
                self.pools.clear()

class CampaignRunner(threading.Thread):
    """Dedicated thread for a single campaign to ensure exact pacing without blocking others."""
    def __init__(self, campaign_id, db, smtp_pool, executor):
        super().__init__(name=f"CampaignRunner-{campaign_id}", daemon=True)
        self.campaign_id = campaign_id
        self.db = db
        self.smtp_pool = smtp_pool
        self.executor = executor
        self.is_running = True

    def run(self):
        print(f"WORKER: Starting parallel runner for Campaign #{self.campaign_id}")
        while self.is_running:
            try:
                with self.db._get_conn() as conn:
                    row = conn.execute("SELECT * FROM campaigns WHERE id = ?", (self.campaign_id,)).fetchone()
                
                if not row:
                    print(f"WORKER: Campaign #{self.campaign_id} not found. Stopping runner.")
                    self.is_running = False
                    break
                
                camp = dict(row)
                if camp['status'] not in ('running',):
                    print(f"WORKER: Campaign #{self.campaign_id} no longer running. Stopping runner.")
                    self.is_running = False
                    break

                delay_seconds = float(camp.get('delay_seconds') or 0.1)
                
                # 2. Pick a BATCH of queued items
                with self.db._get_conn() as conn:
                    now_str = datetime.now(timezone.utc).isoformat()
                    items = conn.execute("""
                        SELECT * FROM send_log
                        WHERE campaign_id = ?
                        AND (status = 'queued' OR (status = 'retrying' AND next_retry_at <= ?))
                        ORDER BY status='retrying' DESC, id ASC
                        LIMIT 100
                    """, (self.campaign_id, now_str)).fetchall()

                if not items:
                    # Check if actually complete
                    with self.db._get_conn() as conn:
                        pending = conn.execute(
                            "SELECT COUNT(*) as count FROM send_log WHERE campaign_id = ? AND status IN ('queued', 'retrying', 'processing')",
                            (self.campaign_id,)
                        ).fetchone()
                        if pending['count'] == 0:
                            self.db.update_campaign_progress(self.campaign_id, camp['total'], "completed")
                            sync_broadcast({"type": "status", "campaign_id": self.campaign_id, "status": "completed"})
                            self.is_running = False
                            break
                    # Wait briefly if still marked running but queue is empty (waiting for retries)
                    time.sleep(5)
                    continue

                items = [dict(it) for it in items]
                
                # 3. Lock batch to 'processing'
                item_ids = [str(item['id']) for item in items]
                with self.db._get_conn() as conn:
                    conn.execute(f"UPDATE send_log SET status = 'processing' WHERE id IN ({','.join(item_ids)})")
                    conn.commit()

                # 4. Dispatch with EXACT pacing
                    # Re-check status before every single email dispatch for instant pause response
                    with self.db._get_conn() as conn:
                        status_row = conn.execute("SELECT status FROM campaigns WHERE id = ?", (self.campaign_id,)).fetchone()
                        
                    if not status_row or dict(status_row)['status'] != 'running':
                            # Re-queue remaining items in this batch
                            rem_idx = items.index(item)
                            rem_ids = [str(i['id']) for i in items[rem_idx:]]
                            conn.execute(f"UPDATE send_log SET status = 'queued' WHERE id IN ({','.join(rem_ids)})")
                            conn.commit()
                            self.is_running = False
                            return

                    # Offload SMTP network latency to the executor pool
                    self.executor.submit(self._dispatch_single, item, camp, self.db)

                    # Pacing Sleep (Rigidly accurate)
                    time.sleep(delay_seconds)

            except Exception as e:
                print(f"Runner Error [Camp #{self.campaign_id}]: {e}")
                time.sleep(5)

    def _dispatch_single(self, item, campaign, db):
        # ... logic as before ...
        import json, re, threading as _threading
        account_id = item['account_id']
        try:
            with db._get_conn() as conn:
                row = conn.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
            if not row:
                with db._get_conn() as conn:
                    conn.execute("UPDATE send_log SET status = 'failed', error_msg = 'Account not found' WHERE id = ?", (item['id'],))
                    conn.commit()
                sync_broadcast({"type": "failed", "campaign_id": campaign['id'], "recipient": item['recipient'], "status": "failed"})
                return

            acc_dict = dict(row)
            recipient = item['recipient'].strip()
            if not recipient or not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', recipient):
                with db._get_conn() as conn:
                    conn.execute("UPDATE send_log SET status = 'failed', error_msg = ? WHERE id = ?", (f"Invalid email: {recipient}", item['id']))
                    conn.commit()
                sync_broadcast({"type": "failed", "campaign_id": campaign['id'], "recipient": recipient, "status": "failed"})
                return

            row_data = json.loads(item['row_data'] or "{}")
            subject_f = campaign['subject']
            body_f = campaign['body_plain']
            for k, v in row_data.items():
                if v is not None:
                    subject_f = subject_f.replace(f"{{{k}}}", str(v))
                    body_f = body_f.replace(f"{{{k}}}", str(v))

            attachment_path = None
            if row_data.get('_attachment_var') and row_data.get('_attachments_batch_id'):
                filename = row_data.get(row_data['_attachment_var'])
                if filename:
                    from pathlib import Path
                    p = Path("uploads/attachments") / row_data['_attachments_batch_id'] / str(filename)
                    if p.exists(): attachment_path = str(p)

            msg, _ = _build_email_message(acc_dict, recipient, subject_f, body_f, item['tracking_id'], attachment_path)

            sent_via_cache = False
            for attempt in range(2):
                server = None
                try:
                    server = self.smtp_pool.get_connection(acc_dict)
                    server.send_message(msg)
                    self.smtp_pool.release_connection(account_id, server)
                    sent_via_cache = True
                    break
                except Exception:
                    if server:
                        try: server.quit()
                        except: pass
                    if attempt == 0: continue
                    execute_node_dispatch(acc_dict, recipient, subject_f, body_f, item['tracking_id'], attachment_path)
                    sent_via_cache = False

            with db._get_conn() as conn:
                conn.execute("UPDATE send_log SET status = 'sent', error_msg = '250 OK', sent_at = CURRENT_TIMESTAMP WHERE id = ?", (item['id'],))
                conn.commit()
            sync_broadcast({"type": "sent", "campaign_id": campaign['id'], "recipient": recipient, "status": "sent"})

            if sent_via_cache:
                _threading.Thread(target=background_imap_sync, args=(acc_dict, recipient, subject_f, body_f, item['tracking_id'], attachment_path), daemon=True).start()

        except Exception as e:
            error_msg = str(e)
            if "250" in error_msg or "235" in error_msg or "Queued" in error_msg:
                with db._get_conn() as conn:
                    conn.execute("UPDATE send_log SET status = 'sent', error_msg = '250 OK', sent_at = CURRENT_TIMESTAMP WHERE id = ?", (item['id'],))
                    conn.commit()
                sync_broadcast({"type": "sent", "campaign_id": campaign['id'], "recipient": item['recipient'], "status": "sent"})
                return

            current_retry = (item['retry_count'] or 0)
            if current_retry < 3:
                backoffs = [5, 10, 20]; wait_sec = backoffs[min(current_retry, 2)]
                next_retry = (datetime.now(timezone.utc) + timedelta(seconds=wait_sec)).isoformat()
                with db._get_conn() as conn:
                    conn.execute("UPDATE send_log SET status='retrying', retry_count=?, next_retry_at=?, error_msg=? WHERE id=?", (current_retry+1, next_retry, error_msg, item['id']))
                    conn.commit()
            else:
                with db._get_conn() as conn:
                    conn.execute("UPDATE send_log SET status='failed', error_msg=? WHERE id=?", (error_msg, item['id']))
                    conn.commit()
                sync_broadcast({"type": "failed", "campaign_id": campaign['id'], "recipient": item['recipient'], "status": "failed"})

class SequentialQueueWorker:
    """Manages parallel campaign runners."""
    def __init__(self):
        self.thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.is_running = False
        self.smtp_pool = SMTPConnectionPool(max_connections_per_account=20)
        self.executor = ThreadPoolExecutor(max_workers=50) # Higher capacity for parallel runners
        self.active_runners = {} # campaign_id -> CampaignRunner
        self.alert_event = threading.Event()

    def start(self):
        self.is_running = True
        self.thread.name = "WorkerManager"
        self.thread.start()

    def alert(self):
        """Wake up the worker instantly (e.g. when user clicks Launch)"""
        self.alert_event.set()

    def _worker_loop(self):
        from data.db import get_db
        db = get_db()
        while self.is_running:
            try:
                # 1. GC: Remove dead runners
                to_remove = [cid for cid, r in self.active_runners.items() if not r.is_alive()]
                for cid in to_remove: del self.active_runners[cid]

                # 2. Monitor: Find campaigns marked 'running'
                with db._get_conn() as conn:
                    running_camps = conn.execute("SELECT id FROM campaigns WHERE status = 'running'").fetchall()

                # 3. Spawn: Start runners for any campaign that isn't running yet in parallel
                for row in running_camps:
                    cid = row['id']
                    if cid not in self.active_runners:
                        print(f"MANAGER: Spawning parallel runner for Campaign #{cid}")
                        runner = CampaignRunner(cid, db, self.smtp_pool, self.executor)
                        self.active_runners[cid] = runner
                        runner.start()

                self.alert_event.wait(5) # Wait 5s or until alerted
                self.alert_event.clear()

            except Exception as e:
                print(f"Worker Manager Error: {e}")
                time.sleep(5)

queue_worker = SequentialQueueWorker()

class GenerateRequest(BaseModel):
    brief: dict
    mode: str = "email"
    variants: int = 1

@app.post("/api/ai/generate")
async def generate_email(req: GenerateRequest):
    from core.ai_generator import AIGenerator
    from dotenv import load_dotenv
    load_dotenv(override=True)
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY", ""))
    results = ai.generate(req.brief, mode=req.mode, variants=req.variants)
    return {"result": results[0], "all_variants": results}

@app.post("/api/ai/rewrite")
async def rewrite_email(body: dict):
    from core.ai_generator import AIGenerator
    from dotenv import load_dotenv
    load_dotenv(override=True)
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY", ""))
    result = ai.rewrite(draft=body.get("draft", ""), instruction=body.get("instruction", ""))
    return {"result": result}

@app.post("/api/ai/subjects")
async def generate_subjects(body: dict):
    from core.ai_generator import AIGenerator
    ai = AIGenerator(groq_api_key=os.getenv("GROQ_API_KEY", ""))
    subjects = ai.generate_subjects(context=body.get("context", ""), count=body.get("count", 10))
    return {"subjects": subjects}

# ── Attachments Endpoints ─────────────────────────────────
@app.post("/api/attachments/upload")
async def upload_attachments(files: list[UploadFile] = File(...)):
    import uuid
    import shutil
    import os
    from pathlib import Path
    
    batch_id = str(uuid.uuid4())
    upload_dir = Path("uploads/attachments") / batch_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    for file in files:
        # webkitdirectory preserves paths (e.g. folder/file.pdf). We flatten it for simple matching.
        safe_filename = os.path.basename(file.filename)
        file_path = upload_dir / safe_filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(safe_filename)
        
    return {"status": "success", "batch_id": batch_id, "files": saved_files}

# ── Campaign Endpoints ────────────────────────────────────
@app.get("/api/campaigns")
async def list_campaigns(page: int = 1, limit: int = 15):
    from data.db import get_all_campaigns, get_all_accounts
    offset = (page - 1) * limit
    result = get_all_campaigns(limit=limit, offset=offset)
    campaigns = result["items"]
    accounts = {str(a["id"]): a["email"] for a in get_all_accounts(limit=1000)["items"]}
    import json
    for c in campaigns:
        try:
            acc_ids = json.loads(c.get("account_ids", "[]") or "[]")
            emails = [accounts.get(str(aid), f"Account {aid}") for aid in acc_ids]
            c["account_emails"] = ", ".join(emails)
        except Exception:
            c["account_emails"] = "Unknown"
    return {"campaigns": campaigns, "total": result["total"]}

@app.get("/api/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int):
    from data.db import get_campaign, get_all_accounts
    c = get_campaign(campaign_id)
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Resolve account emails
    try:
        import json
        acc_ids = json.loads(c.get("account_ids", "[]") or "[]")
        accounts = {str(a["id"]): a["email"] for a in get_all_accounts(limit=1000)["items"]}
        emails = [accounts.get(str(aid), f"Account {aid}") for aid in acc_ids]
        c["account_emails"] = ", ".join(emails)
    except Exception:
        c["account_emails"] = "Unknown"
        
    return c

@app.post("/api/campaigns/{campaign_id}/start")
async def start_campaign(campaign_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_campaign_async, campaign_id)
    return {"status": "started", "campaign_id": campaign_id}

@app.post("/api/campaigns/{campaign_id}/stop")
async def stop_campaign(campaign_id: int):
    # In production we would signal stop event
    return {"status": "stopped"}

def run_campaign_async(campaign_id: int):
    """Bridge for APScheduler to run the campaign in background."""
    import time
    from data.db import get_campaign
    camp = get_campaign(campaign_id)
    if not camp: return
    
    # Reconstruct the CampaignLaunchRequest from DB
    from api_bridge import CampaignLaunchRequest, process_campaign_bulk
    import json
    
    # If it's a single email, data is stored in row_data or similar, 
    # but for simplicity we assume we fetch from send_log if needed, 
    # or just use the data passed at creation.
    # For now, we assume the campaign record has everything.
    
    # We need to handle the 'data' field which might not be in the campaign table yet.
    # I'll update the logic to store 'data' as JSON in a new column if necessary, 
    # but more robustly I can fetch from send_log 'draft' entries.
    
    # Actually, a better way: 
    # When scheduling, we create the campaign and the send_log entries with status 'pending'/'scheduled'.
    # then run_campaign_async processes those 'scheduled' entries.
    
    from data.db import get_db
    db = get_db()
    
    with db._get_conn() as conn:
        rows = conn.execute("SELECT * FROM send_log WHERE campaign_id = ? AND status = 'scheduled'", (campaign_id,)).fetchall()
        data = [json.loads(r['row_data']) if r['row_data'] else {} for r in rows]
        # Ensure recipient_var is handled - we'll assume it's 'recipient' for single emails
        # For campaigns, we'll store the recipient_var in the campaign record if needed.
    
    # For now, let's keep it simple: 
    # We'll re-implement a minimal process loop here or call process_campaign_bulk with a mock request.
    from api_bridge import execute_node_dispatch, sync_broadcast
    from data.db import update_campaign_progress, log_send, get_all_accounts, get_db
    
    db = get_db()
    # Pagination: need the list from 'items'. limit=1000 to cover all accounts for resolving ID.
    accounts_res = get_all_accounts(limit=1000)
    accounts = accounts_res.get('items', [])
    
    # Get active account from campaign record (parsed from JSON)
    acc_ids = json.loads(camp['account_ids'])
    active_acc = next((a for a in accounts if a['id'] == acc_ids[0]), None)
    if not active_acc: return

    update_campaign_progress(campaign_id, total=len(rows), status="running")
    queue_worker.alert()

    for i, row_rec in enumerate(rows):
        t_start = time.time()
        row = json.loads(row_rec['row_data']) if row_rec['row_data'] else {}
        target_email = row_rec['recipient']
        
        subject_f = camp['subject']
        body_f = camp['body_plain']
        for k, v in row.items():
            if v is not None:
                subject_f = subject_f.replace(f"{{{k}}}", str(v))
                body_f = body_f.replace(f"{{{k}}}", str(v))

        attachment_path = None
        attachment_var = row.get('_attachment_var')
        attachments_batch_id = row.get('_attachments_batch_id')
        if attachments_batch_id and attachment_var:
            filename = row.get(attachment_var)
            if filename:
                from pathlib import Path
                possible_path = Path("uploads/attachments") / attachments_batch_id / str(filename)
                if possible_path.exists():
                    attachment_path = str(possible_path)

        try:
            import uuid
            tracking_id = row_rec['tracking_id'] or str(uuid.uuid4())
            execute_node_dispatch(active_acc, target_email, subject_f, body_f, tracking_id, attachment_path)
            
            with db._get_conn() as conn:
                conn.execute("UPDATE send_log SET status='sent', sent_at=CURRENT_TIMESTAMP WHERE id=?", (row_rec['id'],))
                conn.commit()
            sync_broadcast({"type": "sent", "campaign_id": campaign_id, "recipient": target_email, "status": "sent"})
        except Exception as e:
            with db._get_conn() as conn:
                conn.execute("UPDATE send_log SET status='failed', error_msg=? WHERE id=?", (str(e), row_rec['id']))
                conn.commit()
            sync_broadcast({"type": "failed", "campaign_id": campaign_id, "recipient": target_email, "status": "failed"})
        
        # Delay logic (simplified for scheduler)
        if i < len(rows) - 1:
            # We'll assume a default or fetch from campaign if we add it
            import time
            time.sleep(1) # Minimal delay for scheduler
        
    update_campaign_progress(campaign_id, total=len(rows), status="completed")
    queue_worker.alert()

class TestSendRequest(BaseModel):
    subject: str
    body: str
    recipient: str
    account_id: Optional[int] = None

def _build_email_message(acc: dict, to_email: str, subject: str, body: str, tracking_id: str = None, attachment_path: str = None):
    """Build the EmailMessage object (separated so retries don't rebuild it)."""
    from email.message import EmailMessage
    from email.utils import formatdate, make_msgid
    import os, re

    is_html = bool(re.search(r'<[a-z][\s\S]*>', body, re.IGNORECASE))
    plain_body = re.sub(r'<[^>]+>', '', body) if is_html else body

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"{acc['display_name']} <{acc['email']}>" if acc.get('display_name') else acc['email']
    msg['To'] = to_email
    msg['Reply-To'] = acc['email']
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain=acc['email'].split('@')[-1] if '@' in acc['email'] else 'mailblast.local')
    msg.set_content(plain_body, charset='utf-8')

    domain = os.getenv("TRACKING_DOMAIN", "https://mailblast-omega.onrender.com").rstrip('/')
    pixel_html = ""
    if tracking_id:
        pixel_url = f"{domain}/api/t/o/{tracking_id}.gif"
        pixel_html = f"<img src='{pixel_url}' width='1' height='1' style='display:none;' alt='' />"

    if is_html:
        msg.add_alternative(body + pixel_html, subtype='html')
    elif tracking_id:
        html_body = f"<html><body><p>{body.replace(chr(10), '<br>')}</p>{pixel_html}</body></html>"
        msg.add_alternative(html_body, subtype='html')

    if attachment_path:
        import mimetypes
        from pathlib import Path
        p = Path(attachment_path)
        if p.exists():
            ctype, encoding = mimetypes.guess_type(attachment_path)
            if ctype is None or encoding is not None:
                ctype = 'application/octet-stream'
            maintype, subtype = ctype.split('/', 1)
            with open(attachment_path, 'rb') as fp:
                msg.add_attachment(fp.read(), maintype=maintype, subtype=subtype, filename=p.name)

    return msg, plain_body

def background_imap_sync(acc: dict, to_email: str, subject: str, body: str, tracking_id: str = None, attachment_path: str = None):
    """Shadow Sync Worker: Appends to Sent folder in the background (Non-blocking)."""
    import imaplib, time, re
    from core.credential_vault import decrypt_password
    try:
        raw_pwd = decrypt_password(acc['encrypted_pass'])
        pwd = raw_pwd.replace(' ', '').replace('\xa0', '').strip()
        
        msg_obj, _ = _build_email_message(acc, to_email, subject, body, tracking_id=None, attachment_path=attachment_path)
        
        imap_port = int(acc.get('imap_port') or 993)
        imap_host = acc.get('imap_host') or 'imap.gmail.com'
        imap = imaplib.IMAP4_SSL(imap_host, imap_port, timeout=15)
        imap.login(acc['email'], pwd)
        status, folders = imap.list()
        sent_folder_name = None
        if status == 'OK':
            for f in folders:
                folder_str = f.decode('utf-8', errors='ignore')
                name_part = folder_str.split(' "/" ')[-1] if ' "/" ' in folder_str else folder_str.split(' "." ')[-1]
                name = name_part.strip('"').strip()
                flags = folder_str.split(')')[0] + ')'
                if '\\Sent' in flags.replace(' ', ''):
                    sent_folder_name = f'"{name}"'
                    break
                elif name.lower() in ['sent', 'sent items', 'sent mail', '[gmail]/sent mail']:
                    sent_folder_name = f'"{name}"'
        if sent_folder_name:
            imap.append(sent_folder_name, ('\\Seen',), imaplib.Time2Internaldate(time.time()), msg_obj.as_bytes())
        else:
            imap.append('INBOX', ('\\Seen',), imaplib.Time2Internaldate(time.time()), msg_obj.as_bytes())
        imap.logout()
    except Exception as e:
        print(f"IMAP Sync Warning: {e}")

def execute_node_dispatch(acc: dict, to_email: str, subject: str, body: str, tracking_id: str = None, attachment_path: str = None):
    """GOD MODE dispatch: Light-speed delivery with backgrounded IMAP sync."""
    from core.credential_vault import decrypt_password
    import smtplib
    import time
    import re
    import threading

    raw_pwd = decrypt_password(acc['encrypted_pass'])
    pwd = raw_pwd.replace(' ', '').replace('\xa0', '').strip()

    to_email = to_email.strip()
    if not to_email or not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', to_email):
        raise Exception(f"Invalid email format: {to_email}")

    msg, _ = _build_email_message(acc, to_email, subject, body, tracking_id, attachment_path)
    
    # DEBUG: Show tracking URL for manual verification
    domain = os.getenv("TRACKING_DOMAIN", "https://mailblast-omega.onrender.com").rstrip('/')
    if tracking_id:
        print(f"DEBUG: Sent to {to_email} | Tracking URL: {domain}/api/t/o/{tracking_id}.gif")

    # ── GOD MODE RETRY ENGINE ──
    MAX_RETRIES = 3
    TIMEOUTS = [30, 60, 90]
    last_error = None

    for attempt in range(MAX_RETRIES):
        server = None
        try:
            timeout = TIMEOUTS[attempt]
            smtp_port = int(acc.get('smtp_port') or 587)
            smtp_host = acc.get('smtp_host', 'smtp.gmail.com')

            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=timeout)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=timeout)
                server.starttls()

            server.login(acc['email'], pwd)
            server.send_message(msg)
            server.quit()
            server = None
            last_error = None
            break

        except smtplib.SMTPRecipientsRefused as e:
            last_error = e
            try:
                if server: server.quit()
            except: pass
            raise 

        except smtplib.SMTPDataError as e:
            error_code = getattr(e, 'smtp_code', 0) or 0
            last_error = e
            try:
                if server: server.quit()
            except: pass
            if error_code >= 500 and error_code < 600: raise 
            if attempt < MAX_RETRIES - 1: time.sleep((attempt + 1) * 2)

        except Exception as e:
            last_error = e
            try:
                if server: server.quit()
            except: pass
            if attempt < MAX_RETRIES - 1: time.sleep((attempt + 1) * 2)

    if last_error:
        raise last_error

    # ── BLAZE MODE: Shadow IMAP Sync (Fire and Forget) ──
    # We do NOT wait for this. The email is sent. Unblock the engine now!
    threading.Thread(target=background_imap_sync, args=(acc, to_email, subject, body, tracking_id, attachment_path), daemon=True).start()


@app.post("/api/test-send")
async def api_test_send(req: TestSendRequest):
    from data.db import get_all_accounts, log_send
    accounts_res = get_all_accounts(limit=1000)
    accounts = accounts_res.get('items', [])
    if not accounts: raise HTTPException(status_code=400, detail="No accounts configured. Add one first.")
    acc = next((a for a in accounts if a['id'] == req.account_id), None) if req.account_id else accounts[0]
    if not acc: raise HTTPException(status_code=400, detail="Selected account no longer exists.")
    try:
        import uuid
        tracking_id = str(uuid.uuid4())
        execute_node_dispatch(acc, req.recipient, req.subject, req.body, tracking_id)
        log_send(campaign_id=None, account_id=acc['id'], recipient=req.recipient, website='', status='sent', tracking_id=tracking_id)
        return {"status": "success", "message": f"Successfully sent test via {acc['email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CampaignLaunchRequest(BaseModel):
    campaign_name: str
    subject: str
    body: str
    recipient_var: str
    data: list
    delay_seconds: float = 0.1
    account_id: int
    is_test: bool = False
    test_recipients: Optional[str] = None
    attachment_var: Optional[str] = None
    attachments_batch_id: Optional[str] = None

def worker_send_unit(active_acc, target_email, subject_f, body_f, attachment_path, row, campaign_id):
    """Worker task for high-speed parallel dispatch."""
    import uuid, json
    from data.db import log_send
    from api_bridge import execute_node_dispatch, sync_broadcast
    try:
        tracking_id = str(uuid.uuid4())
        execute_node_dispatch(active_acc, target_email, subject_f, body_f, tracking_id, attachment_path)
        log_send(campaign_id=campaign_id, account_id=active_acc['id'], recipient=target_email, website='', status='sent', tracking_id=tracking_id, row_data=json.dumps(row))
        sync_broadcast({"type": "sent", "campaign_id": campaign_id, "recipient": target_email, "status": "sent"})
    except Exception as e:
        error_str = str(e)
        print(f"FAILED: {target_email} — {error_str}")
        log_send(campaign_id=campaign_id, account_id=active_acc['id'], recipient=target_email, website='', status='failed', error_msg=error_str, row_data=json.dumps(row))
        sync_broadcast({"type": "failed", "campaign_id": campaign_id, "recipient": target_email, "status": "failed"})

def process_campaign_bulk(req: CampaignLaunchRequest, campaign_id: int):
    """
    New Sequential Queue Logic: 
    Instead of processing here, we just fill the send_log queue with 'queued' records.
    The background SequentialQueueWorker picks them up one-by-one.
    """
    from data.db import get_all_accounts, get_db
    accounts_res = get_all_accounts(limit=1000)
    accounts = accounts_res.get('items', [])
    import uuid, json, re
    
    EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
    db = get_db()
    
    # Pre-clean the data
    clean_data = []
    for row in req.data:
        raw_email = str(row.get(req.recipient_var, '')).strip()
        if raw_email and EMAIL_RE.match(raw_email):
            # Attach metadata for the worker
            row['_attachment_var'] = req.attachment_var
            row['_attachments_batch_id'] = req.attachments_batch_id
            clean_data.append({"email": raw_email, "row": row})

    # Bulk Insert into send_log
    with db._get_conn() as conn:
        for item in clean_data:
            conn.execute("""
                INSERT INTO send_log (campaign_id, account_id, recipient, row_data, status, tracking_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (campaign_id, req.account_id, item['email'], json.dumps(item['row']), 'queued', str(uuid.uuid4())))
        
        # Store delay_seconds in campaign metadata for the worker to find
        # Note: I added a migration later, but for now we'll update the name or just set it
        # Actually, let's just use the column if it exists or default to 5.
        try:
            conn.execute("UPDATE campaigns SET total = ?, status = 'running', delay_seconds = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?", (len(clean_data), req.delay_seconds, campaign_id))
        except:
            conn.execute("UPDATE campaigns SET total = ?, status = 'running' WHERE id = ?", (len(clean_data), campaign_id))
        conn.commit()
    
    sync_broadcast({"type": "status", "campaign_id": campaign_id, "status": "running"})
    queue_worker.alert()


@app.post("/api/campaign/launch")
async def api_launch_campaign(req: CampaignLaunchRequest, bg_tasks: BackgroundTasks):
    from data.db import get_all_accounts, create_campaign, get_db
    accounts_res = get_all_accounts(limit=1000)
    accounts = accounts_res.get('items', [])
    if not accounts: raise HTTPException(status_code=400, detail="No accounts bound.")
    if not req.data and not req.is_test: raise HTTPException(status_code=400, detail="Empty sheet data.")
    
    camp_id = create_campaign(
        name=req.campaign_name, 
        account_ids=[req.account_id], 
        rotation_mode='single', 
        subject=req.subject, 
        body_plain=req.body, 
        body_html="", 
        use_html=0, 
        tracking_enabled=1,
        campaign_type='campaign',
        is_test=req.is_test
    )
    
    # Launch immediately in background
    
    bg_tasks.add_task(process_campaign_bulk, req, camp_id)
    return {"status": "success", "campaign_id": camp_id, "message": f"Engine engaged! Dispatching {len(req.data)} targets."}

@app.post("/api/scheduler/create")
async def api_schedule_campaign(req: CampaignLaunchRequest, scheduled_at: str):
    from data.db import create_campaign, get_db
    from core.scheduler_engine import SchedulerEngine
    import datetime as dt
    import uuid
    
    run_dt = dt.datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
    
    camp_id = create_campaign(
        name=req.campaign_name,
        account_ids=[req.account_id],
        rotation_mode='single',
        subject=req.subject,
        body_plain=req.body,
        body_html="",
        use_html=0,
        tracking_enabled=1,
        campaign_type='campaign',
        scheduled_at=scheduled_at,
        is_test=req.is_test
    )
    
    # Store scheduled logs
    db = get_db()
    with db._get_conn() as conn:
        for row in req.data:
            recipient = row.get(req.recipient_var)
            if recipient:
                row['_attachment_var'] = req.attachment_var
                row['_attachments_batch_id'] = req.attachments_batch_id
                conn.execute("""
                    INSERT INTO send_log (campaign_id, account_id, recipient, row_data, status, tracking_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (camp_id, req.account_id, recipient, json.dumps(row), 'scheduled', str(uuid.uuid4())))
        # SET the total number of emails for the campaign record immediately
        conn.execute("UPDATE campaigns SET total = ? WHERE id = ?", (len(req.data), camp_id))
        conn.commit()
    
    job_id = scheduler_engine.schedule_campaign(camp_id, run_dt)
    
    return {"status": "success", "campaign_id": camp_id, "job_id": job_id}

class SingleEmailScheduleRequest(BaseModel):
    recipient: str
    subject: str
    body: str
    account_id: int
    scheduled_at: str # ISO

@app.post("/api/scheduler/single")
async def api_schedule_single(req: SingleEmailScheduleRequest):
    from data.db import create_campaign, get_db
    from core.scheduler_engine import SchedulerEngine
    import datetime as dt
    import uuid
    import json
    
    run_dt = dt.datetime.fromisoformat(req.scheduled_at.replace('Z', '+00:00'))
    
    camp_name = f"Single Email: {req.recipient}"
    camp_id = create_campaign(
        name=camp_name,
        account_ids=[req.account_id],
        rotation_mode='single',
        subject=req.subject,
        body_plain=req.body,
        body_html="",
        use_html=0,
        tracking_enabled=1,
        campaign_type='single',
        scheduled_at=req.scheduled_at,
        is_test=False # Single emails scheduled are currently forced to real
    )
    
    db = get_db()
    tracking_id = str(uuid.uuid4())
    with db._get_conn() as conn:
        conn.execute("""
            INSERT INTO send_log (campaign_id, account_id, recipient, row_data, status, tracking_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (camp_id, req.account_id, req.recipient, json.dumps({"recipient": req.recipient}), 'scheduled', tracking_id))
        # Update total to 1
        conn.execute("UPDATE campaigns SET total = 1 WHERE id = ?", (camp_id,))
        conn.commit()
    
    # No more 'engine = scheduler_engine' alias, use global
    job_id = scheduler_engine.schedule_campaign(camp_id, run_dt)
    
    return {"status": "success", "campaign_id": camp_id, "job_id": job_id}

@app.get("/api/scheduler/list")
async def list_scheduled_jobs(page: int = 1, limit: int = 15):
    offset = (page - 1) * limit
    result = scheduler_engine.list_jobs(limit=limit, offset=offset)
    return {"jobs": result["items"], "total": result["total"]}

@app.delete("/api/scheduler/jobs/{job_id}")
async def cancel_scheduled_job(job_id: int):
    scheduler_engine.cancel_job(job_id)
    return {"status": "success"}

# ── Analytics Endpoints ───────────────────────────────────
@app.get("/api/analytics/stats")
async def get_stats(range: str = 'today', account_id: Optional[int] = None):
    from data.db import get_global_stats
    return get_global_stats(time_range=range, account_id=account_id)

@app.get("/api/analytics/recent-campaigns")
async def get_recent_campaigns_api():
    from data.db import get_recent_campaigns
    return {"campaigns": get_recent_campaigns(limit=5)}

@app.get("/api/analytics/open-rate-history")
async def get_dispatch_history_api(range: str = '7d', account_id: Optional[int] = None):
    from data.db import get_dispatch_history
    return {"data": get_dispatch_history(time_range=range, account_id=account_id)}

@app.get("/api/analytics/send-log")
async def get_send_log(campaign_id: int = None, account_id: int = None, tracking_status: str = 'all', page: int = 1, limit: int = 15):
    from data.db import get_send_log
    offset = (page - 1) * limit
    result = get_send_log(campaign_id=campaign_id, account_id=account_id, tracking_status=tracking_status, limit=limit, offset=offset)
    return {"log": result["items"], "total": result["total"]}

@app.get("/api/t/o/{tracking_id}.gif")
async def track_open(tracking_id: str, request: Request, background_tasks: BackgroundTasks):
    from data.db import mark_opened, get_db
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get('user-agent', '')
    
    # Detailed logging for debugging
    domain = os.getenv("TRACKING_DOMAIN", "https://mailblast-omega.onrender.com").rstrip('/')
    print(f"TRACKING HIT: {tracking_id} | Domain: {domain} | IP: {ip} | UA: {ua}")
    if "ngrok" in domain and ".gif" in request.url.path:
        print(f"DEBUG: Tracking pixel requested via ngrok: {request.url}")
    
    event_type = mark_opened(tracking_id, ip, ua)
    
    # Always log tracking hits for visual verification in console
    print(f"TRACKING DEBUG: ID={tracking_id} | IP={ip} | RESULT={event_type}")

    if event_type == "open":
        try:
            with get_db()._get_conn() as conn:
                row = conn.execute("SELECT id, campaign_id, open_count FROM send_log WHERE tracking_id = ?", (tracking_id,)).fetchone()
                if row:
                    background_tasks.add_task(broadcast_log_event, {
                        "type": "opened",
                        "log_id": row["id"],
                        "campaign_id": row["campaign_id"],
                        "open_count": row["open_count"]
                    })
        except:
            pass
    elif event_type and event_type.startswith("ignored_"):
        # Log to server console for debugging if needed
        print(f"Tracking hit ignored for {tracking_id}: {event_type} (IP: {ip})")
            
    pixel = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
    headers = {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
    }
    return Response(content=pixel, media_type="image/gif", headers=headers)

@app.get("/api/analytics/send-log/{log_id}/details")
async def get_send_log_details(log_id: int):
    from fastapi import HTTPException
    from data.db import get_db
    import json
    with get_db()._get_conn() as conn:
        row = conn.execute("SELECT * FROM send_log WHERE id = ?", (log_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Log entry not found")
        
        log_data = dict(row)
        subject = "Unknown Subject (Test Send)"
        body = "Content not available for sandbox tests."
        
        if log_data.get("campaign_id"):
            camp = conn.execute("SELECT * FROM campaigns WHERE id = ?", (log_data["campaign_id"],)).fetchone()
            if camp:
                subject = camp["subject"] or "No Subject"
                body = camp["body_plain"] or ""
                
                if log_data.get("row_data"):
                    try:
                        row_json = json.loads(log_data["row_data"])
                        for k, v in row_json.items():
                            if v is not None:
                                subject = subject.replace(f"{{{k}}}", str(v))
                                body = body.replace(f"{{{k}}}", str(v))
                                
                        # Extract attachment metadata
                        att_var = row_json.get('_attachment_var')
                        if att_var and row_json.get(att_var):
                            log_data["attachment_filename"] = row_json.get(att_var)
                    except:
                        pass
                        
        log_data["reconstructed_subject"] = subject
        log_data["reconstructed_body"] = body
        return log_data

# ── Settings Endpoints ────────────────────────────────────
@app.get("/api/settings/get_groq")
async def get_groq_key():
    from dotenv import load_dotenv
    import os
    load_dotenv(override=True)
    return {"key": os.getenv("GROQ_API_KEY", "")}

@app.post("/api/settings/update_groq")
async def update_groq_key(data: dict):
    key = data.get("key", "")
    env_path = ".env"
    import os
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
        with open(env_path, "w") as f:
            key_found = False
            for line in lines:
                if line.startswith("GROQ_API_KEY="):
                    f.write(f"GROQ_API_KEY={key}\n")
                    key_found = True
                else:
                    f.write(line)
            if not key_found:
                f.write(f"\nGROQ_API_KEY={key}\n")
    os.environ["GROQ_API_KEY"] = key
    return {"status": "success"}

@app.get("/api/settings/get_seeds")
async def get_seeds():
    seeds_path = "seeds.txt"
    if os.path.exists(seeds_path):
        with open(seeds_path, "r") as f:
            return {"seeds": f.read()}
    return {"seeds": ""}

@app.post("/api/settings/update_seeds")
async def update_seeds(data: dict):
    seeds = data.get("seeds", "")
    with open("seeds.txt", "w") as f:
        f.write(seeds)
    return {"status": "success"}

# ── Accounts Endpoints ────────────────────────────────────
@app.get("/api/accounts")
async def list_accounts(page: int = 1, limit: int = 15):
    from data.db import get_all_accounts
    offset = (page - 1) * limit
    result = get_all_accounts(limit=limit, offset=offset)
    return {"accounts": result["items"], "total": result["total"]}

class AccountRequest(BaseModel):
    provider: str
    email: str
    password: str
    display_name: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    imap_host: str = "imap.gmail.com"
    imap_port: int = 993

@app.post("/api/accounts/add")
async def api_add_account(req: AccountRequest):
    from data.db import add_account
    from core.credential_vault import encrypt_password
    enc = encrypt_password(req.password)
    acc_id = add_account(
        provider=req.provider,
        email=req.email,
        display_name=req.display_name,
        encrypted_pass=enc.decode() if isinstance(enc, bytes) else enc,
        smtp_host=req.smtp_host,
        smtp_port=req.smtp_port,
        imap_host=req.imap_host,
        imap_port=req.imap_port
    )
    return {"status": "success", "account_id": acc_id}

@app.delete("/api/accounts/{account_id}")
async def delete_account(account_id: int):
    from data.db import soft_delete_item
    soft_delete_item("accounts", account_id)
    return {"status": "deleted"}

class EditAccountRequest(BaseModel):
    display_name: str = ""
    password: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    imap_host: str = "imap.gmail.com"
    imap_port: int = 993

@app.put("/api/accounts/{account_id}")
async def edit_account(account_id: int, req: EditAccountRequest):
    from data.db import get_db
    from core.credential_vault import encrypt_password
    with get_db()._get_conn() as conn:
        if req.password:
            enc = encrypt_password(req.password)
            enc_str = enc.decode() if isinstance(enc, bytes) else enc
            conn.execute("""
                UPDATE accounts 
                SET display_name=?, encrypted_pass=?, smtp_host=?, smtp_port=?, imap_host=?, imap_port=?
                WHERE id=?
            """, (req.display_name, enc_str, req.smtp_host, req.smtp_port, req.imap_host, req.imap_port, account_id))
            conn.commit()
        else:
            conn.execute("""
                UPDATE accounts 
                SET display_name=?, smtp_host=?, smtp_port=?, imap_host=?, imap_port=?
                WHERE id=?
            """, (req.display_name, req.smtp_host, req.smtp_port, req.imap_host, req.imap_port, account_id))
            conn.commit()
    return {"status": "success"}

@app.post("/api/accounts/gmail/auth-url")
async def gmail_auth_url():
    """Returns OAuth URL for Gmail login from web browser."""
    from core.gmail_client import get_oauth_url
    return {"url": get_oauth_url()}

# ── Warm-Up Endpoints ─────────────────────────────────────
active_warmups = {} # account_id -> threading.Event

class WarmupSender:
    def __init__(self, acc):
        self.acc = acc
    def send_email(self, to_email: str, subject: str, body: str, html: bool = False):
        # We use a simplified version of execute_node_dispatch or call it directly
        execute_node_dispatch(self.acc, to_email, subject, body, tracking_id=None)
        return {"status": "sent"}

def run_warmup_loop(account_id: int, stop_event: threading.Event):
    from core.warmup_engine import WarmUpEngine
    from data.db import get_db, get_all_accounts
    
    db = get_db()
    accounts_res = get_all_accounts(limit=1000)
    accounts = accounts_res.get('items', [])
    acc = next((a for a in accounts if a['id'] == account_id), None)
    if not acc: return
    
    sender = WarmupSender(acc)
    
    # Load seeds from file or use fallback
    seeds = []
    if os.path.exists("seeds.txt"):
        with open("seeds.txt", "r") as f:
            seeds = [s.strip() for s in f.readlines() if "@" in s]
    
    if not seeds:
        seeds = ["warmup-seed-1@omega.io", "warmup-seed-2@omega.io"] # Fallback
        
    engine = WarmUpEngine(sender, db, seeds)
    
    print(f"WARMUP: Started loop for {acc['email']} with {len(seeds)} seeds.")
    
    while not stop_event.is_set():
        try:
            sent = engine.run_daily_warmup(account_id)
            print(f"WARMUP: Completed daily cycle for {acc['email']}. Sent: {sent}")
            # In a real app we'd wait 24h, but for testing we'll wait 5 mins or until stopped
            for _ in range(300): # 5 mins wait
                if stop_event.is_set(): break
                time.sleep(1)
        except Exception as e:
            print(f"WARMUP ERROR: {e}")
            time.sleep(60)

@app.post("/api/warmup/toggle/{account_id}")
async def toggle_warmup(account_id: int, data: dict):
    enabled = data.get("enabled", False)
    import threading
    
    if enabled:
        if account_id in active_warmups:
            return {"status": "already_running"}
        
        stop_event = threading.Event()
        active_warmups[account_id] = stop_event
        thread = threading.Thread(target=run_warmup_loop, args=(account_id, stop_event), daemon=True)
        thread.start()
        return {"status": "started"}
    else:
        if account_id in active_warmups:
            active_warmups[account_id].set()
            del active_warmups[account_id]
            return {"status": "stopped"}
        return {"status": "not_running"}

@app.get("/api/warmup/status")
async def get_warmup_status():
    return {"active_ids": list(active_warmups.keys())}

@app.get("/api/warmup/stats")
async def get_warmup_stats_api():
    from data.db import get_warmup_stats
    return get_warmup_stats()

# ── WebSocket — Live Log ──────────────────────────────────
connected_clients: list[WebSocket] = []

@app.websocket("/ws/live-log")
async def live_log_ws(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(30)  # Keep alive
            await websocket.send_text(json.dumps({"type": "ping"}))
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

async def broadcast_log_event(event: dict):
    """Called by OmegaSender to push events to all browser clients."""
    for ws in connected_clients[:]:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            connected_clients.remove(ws)

# ── Health Check ──────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

# ── Campaign Control Endpoints ──────────────────────────
@app.post("/api/campaign/{campaign_id}/pause")
async def pause_campaign(campaign_id: int):
    from data.db import get_db
    db = get_db()
    with db._get_conn() as conn:
        conn.execute("UPDATE campaigns SET status = 'paused' WHERE id = ?", (campaign_id,))
        conn.commit()
    sync_broadcast({"type": "status", "campaign_id": campaign_id, "status": "paused"})
    return {"status": "success", "message": "Campaign paused."}

@app.post("/api/campaign/{campaign_id}/resume")
async def resume_campaign(campaign_id: int):
    from data.db import get_db
    db = get_db()
    with db._get_conn() as conn:
        conn.execute("UPDATE campaigns SET status = 'running' WHERE id = ?", (campaign_id,))
        conn.commit()
    sync_broadcast({"type": "status", "campaign_id": campaign_id, "status": "running"})
    return {"status": "success", "message": "Campaign resumed."}

@app.post("/api/campaign/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: int):
    from data.db import get_db
    db = get_db()
    with db._get_conn() as conn:
        conn.execute("UPDATE campaigns SET status = 'cancelled' WHERE id = ?", (campaign_id,))
        conn.execute("UPDATE send_log SET status = 'cancelled' WHERE campaign_id = ? AND status = 'queued'", (campaign_id,))
        conn.commit()
    sync_broadcast({"type": "status", "campaign_id": campaign_id, "status": "cancelled"})
    return {"status": "success", "message": "Campaign cancelled."}

@app.get("/api/blacklist")
async def api_get_blacklist(page: int = 1, limit: int = 15):
    from data.db import get_blacklist
    offset = (page - 1) * limit
    return get_blacklist(limit=limit, offset=offset)

@app.post("/api/blacklist/add")
async def api_add_blacklist(data: dict):
    from data.db import add_to_blacklist
    email = data.get("email")
    if not email: return {"status": "error", "message": "Email is required"}
    add_to_blacklist(email)
    return {"status": "success"}

@app.delete("/api/blacklist/{email}")
async def api_remove_blacklist(email: str):
    from data.db import remove_from_blacklist
    remove_from_blacklist(email)
    return {"status": "success"}

# --- Templates Endpoints ---
@app.get("/api/templates")
async def list_templates(page: int = 1, limit: int = 15):
    from data.db import get_templates
    offset = (page - 1) * limit
    return get_templates(limit=limit, offset=offset)

@app.post("/api/templates/add")
async def api_add_template(data: dict):
    from data.db import add_template
    name = data.get("name")
    subject = data.get("subject")
    body = data.get("body")
    if not name: return {"status": "error", "message": "Name is required"}
    add_template(name, subject, body)
    return {"status": "success"}

@app.delete("/api/templates/{template_id}")
async def api_remove_template(template_id: int):
    from data.db import soft_delete_item
    soft_delete_item("templates", template_id)
    return {"status": "success"}

@app.delete("/api/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: int):
    from data.db import soft_delete_item
    success = soft_delete_item("campaigns", campaign_id)
    return {"status": "success"} if success else {"status": "error"}

@app.delete("/api/analytics/send-log/{log_id}")
async def delete_send_log(log_id: int):
    from data.db import soft_delete_item
    success = soft_delete_item("send_log", log_id)
    return {"status": "success"} if success else {"status": "error"}

# --- Trash Endpoints ---
@app.get("/api/trash/{category}")
async def fetch_trash(category: str, page: int = 1, limit: int = 50):
    from data.db import get_trash
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories:
        return {"items": [], "total": 0}
    offset = (page - 1) * limit
    res = get_trash(valid_categories[category], limit=limit, offset=offset)
    return {"items": res["items"], "total": res["total"]}

@app.post("/api/trash/{category}/{item_id}/restore")
async def restore_trash_item(category: str, item_id: int):
    from data.db import restore_item
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories: return {"status": "error"}
    success = restore_item(valid_categories[category], item_id)
    return {"status": "success"} if success else {"status": "error"}

@app.delete("/api/trash/{category}/{item_id}/hard")
async def hard_delete_trash_item(category: str, item_id: int):
    from data.db import hard_delete_item
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories: return {"status": "error"}
    success = hard_delete_item(valid_categories[category], item_id)
    return {"status": "success"} if success else {"status": "error"}

@app.post("/api/trash/{category}/empty")
async def api_empty_trash(category: str):
    from data.db import empty_trash
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories: return {"status": "error"}
    success = empty_trash(valid_categories[category])
    return {"status": "success"} if success else {"status": "error"}

@app.post("/api/trash/{category}/restore-all")
async def api_restore_all_trash(category: str):
    from data.db import restore_all_items
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories: return {"status": "error"}
    success = restore_all_items(valid_categories[category])
    return {"status": "success"} if success else {"status": "error"}

@app.post("/api/trash/{category}/delete-all")
async def api_delete_all_active(category: str):
    from data.db import delete_all_items
    valid_categories = {"campaigns": "campaigns", "accounts": "accounts", "templates": "templates", "sent_emails": "send_log"}
    if category not in valid_categories: return {"status": "error"}
    success = delete_all_items(valid_categories[category])
    return {"status": "success"} if success else {"status": "error"}

if __name__ == "__main__":
    # Disable reload in production to save CPU
    uvicorn.run("api_bridge:app", host="0.0.0.0", port=8000, reload=False)
