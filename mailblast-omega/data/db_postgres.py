import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool
import json
import os
from datetime import datetime
import contextvars

current_user_id = contextvars.ContextVar('current_user_id', default=None)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Map to mailblast-omega/database/omega.db strictly
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'database', 'omega.db'))


DATABASE_URL = os.environ.get("DATABASE_URL", "")

class Database:
    def __init__(self, db_url: str = DATABASE_URL):
        self.db_url = db_url
        self.pool = ThreadedConnectionPool(1, 10, dsn=self.db_url)
        self._init_db()

    def _get_conn(self):
        class ConnWrapper:
            def __init__(self, pool):
                self.pool = pool
                self.conn = None
            def __enter__(self):
                self.conn = self.pool.getconn()
                self.conn.autocommit = False
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type:
                    self.conn.rollback()
                self.pool.putconn(self.conn)
            def execute(self, query, params=None):
                cur = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                query = query.replace("?", "%s")
                cur.execute(query, params or ())
                return cur
            def executescript(self, query):
                cur = self.conn.cursor()
                cur.execute(query)
            def commit(self):
                self.conn.commit()
        return ConnWrapper(self.pool)
    def _init_db(self):
        schema = """
        -- Accounts
        CREATE TABLE IF NOT EXISTS accounts (
            id              SERIAL PRIMARY KEY,
            provider        TEXT NOT NULL,
            email           TEXT NOT NULL,
            display_name    TEXT,
            token_path      TEXT,
            imap_host       TEXT,
            imap_port       INTEGER DEFAULT 993,
            smtp_host       TEXT,
            smtp_port       INTEGER DEFAULT 587,
            smtp_security   TEXT DEFAULT 'STARTTLS',
            username        TEXT,
            encrypted_pass  TEXT,           -- Fernet encrypted
            daily_limit     INTEGER DEFAULT 0,  -- 0 = unlimited
            warmup_mode     INTEGER DEFAULT 0,
            warmup_day      INTEGER DEFAULT 0,
            total_sent      INTEGER DEFAULT 0,
            reputation_score INTEGER DEFAULT 100,
            is_active       INTEGER DEFAULT 1,
            created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            user_id         TEXT,
            deleted_at      TEXT DEFAULT NULL,
            UNIQUE(email, user_id)
        );

        -- Campaigns
        CREATE TABLE IF NOT EXISTS campaigns (
            id              SERIAL PRIMARY KEY,
            name            TEXT NOT NULL,
            account_ids     TEXT,           -- JSON array of account IDs (rotation)
            rotation_mode   TEXT DEFAULT 'single',  -- single | round_robin | random
            subject         TEXT,
            body_plain      TEXT,
            body_html       TEXT,
            use_html        INTEGER DEFAULT 0,
            tracking_enabled INTEGER DEFAULT 1,
            click_tracking  INTEGER DEFAULT 1,
            campaign_type   TEXT DEFAULT 'campaign', -- 'campaign' | 'single'
            status          TEXT DEFAULT 'draft',
            total           INTEGER DEFAULT 0,
            sent            INTEGER DEFAULT 0,
            failed          INTEGER DEFAULT 0,
            opened          INTEGER DEFAULT 0,
            clicked         INTEGER DEFAULT 0,
            bounced         INTEGER DEFAULT 0,
            unsubscribed    INTEGER DEFAULT 0,
            scheduled_at    TEXT,           -- ISO datetime if scheduled
            timezone        TEXT,
            created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            started_at      TEXT,
            finished_at     TEXT,
            is_test         INTEGER DEFAULT 0,
            delay_seconds   INTEGER DEFAULT 5
        );

        -- Per-email send log
        CREATE TABLE IF NOT EXISTS send_log (
            id              SERIAL PRIMARY KEY,
            campaign_id     INTEGER REFERENCES campaigns(id),
            account_id      INTEGER REFERENCES accounts(id),
            recipient       TEXT NOT NULL,
            website         TEXT,
            row_data        TEXT,           -- full JSON of the Excel row
            status          TEXT,           -- 'queued' | 'sent' | 'failed' | 'retrying' | 'cancelled'
            error_msg       TEXT,
            tracking_id     TEXT UNIQUE,    -- UUID for open tracking
            retry_count     INTEGER DEFAULT 0,
            next_retry_at   TEXT,           -- ISO UTC timestamp
            opened          INTEGER DEFAULT 0,
            open_count      INTEGER DEFAULT 0,
            first_opened_at TEXT,
            last_opened_at  TEXT,
            clicked         INTEGER DEFAULT 0,
            click_count     INTEGER DEFAULT 0,
            bounced         INTEGER DEFAULT 0,
            sent_at         TEXT DEFAULT CURRENT_TIMESTAMP,
            sender_ignore_until TEXT  -- ISO UTC. Cooldown for sender opens
        );

        -- Tracking events (pixel hits)
        CREATE TABLE IF NOT EXISTS tracking_events (
            id          SERIAL PRIMARY KEY,
            tracking_id TEXT REFERENCES send_log(tracking_id),
            event_type  TEXT,               -- 'open' | 'click'
            ip_address  TEXT,
            user_agent  TEXT,
            url_clicked TEXT,               -- for click events
            occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Scheduled jobs
        CREATE TABLE IF NOT EXISTS scheduled_jobs (
            id              SERIAL PRIMARY KEY,
            campaign_id     INTEGER REFERENCES campaigns(id),
            scheduled_at    TEXT NOT NULL,  -- ISO datetime UTC
            timezone        TEXT,
            local_time      TEXT,           -- display time in target tz
            status          TEXT DEFAULT 'pending',  -- pending | running | done | cancelled
            apscheduler_id  TEXT UNIQUE,
            created_at      TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Saved templates
        CREATE TABLE IF NOT EXISTS templates (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            subject     TEXT,
            body_plain  TEXT,
            body_html   TEXT,
            variables   TEXT,               -- JSON list of variable names found
            use_html    INTEGER DEFAULT 0,
            user_id     TEXT,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at  TEXT
        );

        -- Global blacklist / suppression
        CREATE TABLE IF NOT EXISTS blacklist (
            id          SERIAL PRIMARY KEY,
            email       TEXT NOT NULL,
            reason      TEXT,               -- 'bounced' | 'unsubscribed' | 'manual'
            user_id     TEXT,
            added_at    TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, user_id)
        );

        -- Custom variable definitions
        CREATE TABLE IF NOT EXISTS variable_definitions (
            id          SERIAL PRIMARY KEY,
            name        TEXT UNIQUE NOT NULL,   -- e.g. "FirstName"
            description TEXT,
            default_val TEXT,
            column_hint TEXT,                   -- suggested Excel column name
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- AI generation history
        CREATE TABLE IF NOT EXISTS ai_history (
            id          SERIAL PRIMARY KEY,
            engine      TEXT,               -- 'gpt4o' | 'claude' | 'groq/llama-3.3-70b'
            prompt      TEXT,
            output      TEXT,
            tokens_used INTEGER,
            created_at  TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Account warm-up log
        CREATE TABLE IF NOT EXISTS warmup_log (
            id          SERIAL PRIMARY KEY,
            account_id  INTEGER REFERENCES accounts(id),
            day_number  INTEGER,
            emails_sent INTEGER,
            target      INTEGER,
            success_rate REAL,
            date        TEXT DEFAULT CURRENT_DATE
        );

        -- Internal IPs (Sender devices)
        -- Sender fingerprints (Dashboards/Sessions)
        CREATE TABLE IF NOT EXISTS internal_ips (
            ip              TEXT,
            user_agent      TEXT,
            last_seen       TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (ip, user_agent)
        );
        """
        with self._get_conn() as conn:
            conn.executescript(schema)
            
            # Migration: add retry_count if not exists
            try:
                conn.execute("ALTER TABLE send_log ADD COLUMN retry_count INTEGER DEFAULT 0")
            except: pass
            
            # Migration: add next_retry_at if not exists
            try:
                conn.execute("ALTER TABLE send_log ADD COLUMN next_retry_at TEXT")
            except: pass

            # Migration: add delay_seconds to campaigns if not exists
            try:
                conn.execute("ALTER TABLE campaigns ADD COLUMN delay_seconds INTEGER DEFAULT 5")
            except: pass
            
            # Migration: add user_id column
            try:
                conn.execute("ALTER TABLE accounts ADD COLUMN user_id TEXT")
            except: pass
            try:
                conn.execute("ALTER TABLE campaigns ADD COLUMN user_id TEXT")
            except: pass
            try:
                conn.execute("ALTER TABLE templates ADD COLUMN user_id TEXT")
            except: pass

            # Migration: add deleted_at
            try:
                conn.execute("ALTER TABLE accounts ADD COLUMN deleted_at TEXT DEFAULT NULL")
            except: pass
            try:
                conn.execute("ALTER TABLE campaigns ADD COLUMN deleted_at TEXT DEFAULT NULL")
            except: pass
            try:
                conn.execute("ALTER TABLE send_log ADD COLUMN deleted_at TEXT DEFAULT NULL")
            except: pass
            try:
                conn.execute("ALTER TABLE templates ADD COLUMN deleted_at TEXT DEFAULT NULL")
            except: pass

            conn.commit()

    # --- Blacklist ---
    def get_blacklist_set(self) -> set:
        with self._get_conn() as conn:
            rows = conn.execute("SELECT email FROM blacklist").fetchall()
            return {row["email"].lower() for row in rows}

    def add_to_blacklist(self, email: str, reason: str = "manual"):
        with self._get_conn() as conn:
            conn.execute("INSERT INTO blacklist (email, reason) VALUES (?, ?) ON CONFLICT (email, user_id) DO NOTHING", (email.lower(), reason))
            conn.commit()

    # --- Internal IP & Fingerprint Registry ---
    def register_internal_ip(self, ip: str, user_agent: str = ""):
        if not ip or ip == "unknown": return
        try:
            with self._get_conn() as conn:
                conn.execute("""
                    INSERT INTO internal_ips (ip, user_agent, last_seen) 
                    VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(ip, user_agent) DO UPDATE SET last_seen = CURRENT_TIMESTAMP
                """, (ip, user_agent))
                conn.commit()
        except: pass

    def is_internal_ip(self, ip: str, user_agent: str = "") -> bool:
        if not ip or ip == "unknown": return False
        if ip in ("127.0.0.1", "localhost", "::1"): return True
        with self._get_conn() as conn:
            # Match exactly on IP + UserAgent for strongest exclusion
            row = conn.execute("""
                SELECT 1 FROM internal_ips 
                WHERE ip = ? AND user_agent = ? 
                AND last_seen > NOW() - INTERVAL '24 hours'
            """, (ip, user_agent)).fetchone()
            return True if row else False

    # --- Send Logging ---
    def log_send(self, campaign_id, account_id, recipient, website, status, error_msg=None, tracking_id=None, row_data=None):
        import datetime as dt
        # Restore 60-second cooldown to block instant previews and Sent folder pre-fetches
        cooldown = (dt.datetime.utcnow() + dt.timedelta(seconds=60)).isoformat()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO send_log (campaign_id, account_id, recipient, website, row_data, status, error_msg, tracking_id, sender_ignore_until)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (campaign_id, account_id, recipient, website, row_data, status, error_msg, tracking_id, cooldown))
            conn.commit()

    def get_send_log(self, campaign_id: int = None, account_id: int = None, tracking_status: str = 'all', limit: int = 15, offset: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            # 1. Base WHERE clause
            where_clauses = ["status IN ('sent', 'failed')", "deleted_at IS NULL"]
            params = []
            
            if campaign_id:
                where_clauses.append("campaign_id = ?")
                params.append(campaign_id)
            if account_id:
                where_clauses.append("account_id = ?")
                params.append(account_id)
            if uid:
                where_clauses.append("account_id IN (SELECT id FROM accounts WHERE user_id = ?)")
                params.append(uid)
            
            if tracking_status == 'opened':
                where_clauses.append("opened > 0")
            elif tracking_status == 'pending':
                where_clauses.append("opened = 0")
                
            where_str = " WHERE " + " AND ".join(where_clauses)

            # 1. Get count
            total = conn.execute(f"SELECT COUNT(*) FROM send_log {where_str}", params).fetchone()[0] or 0

            # 2. Get items
            query = f"SELECT * FROM send_log {where_str} ORDER BY sent_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            rows = conn.execute(query, params).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

    # --- Campaigns ---
    def create_campaign(self, name, account_ids, rotation_mode, subject, body_plain, body_html, use_html, tracking_enabled, campaign_type='campaign', scheduled_at=None, is_test=False):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            cursor = conn.execute("""
                INSERT INTO campaigns (name, account_ids, rotation_mode, subject, body_plain, body_html, use_html, tracking_enabled, campaign_type, scheduled_at, status, is_test, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
            """, (name, json.dumps(account_ids), rotation_mode, subject, body_plain, body_html, use_html, tracking_enabled, campaign_type, scheduled_at, 'scheduled' if scheduled_at else 'draft', 1 if is_test else 0, uid))
            return cursor.fetchone()[0] if cursor.rowcount > 0 else None

    def update_campaign_progress(self, campaign_id, total, status):
        with self._get_conn() as conn:
            if status == "running":
                conn.execute("UPDATE campaigns SET total = ?, status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?", (total, status, campaign_id))
            elif status == "completed":
                conn.execute("UPDATE campaigns SET status = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?", (status, campaign_id))

    def get_all_campaigns(self, limit: int = 15, offset: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            # 1. Get count
            count_query = "SELECT COUNT(*) FROM campaigns WHERE deleted_at IS NULL"
            count_params = []
            if uid:
                count_query += " AND user_id = ?"
                count_params.append(uid)
            
            total = conn.execute(count_query, count_params).fetchone()[0] or 0

            # 2. Get items
            query = """
                SELECT c.*, 
                       (SELECT COUNT(*) FROM send_log WHERE campaign_id = c.id AND status='sent') as sent_count,
                       (SELECT COUNT(*) FROM send_log WHERE campaign_id = c.id AND status='failed') as failed_count
                FROM campaigns c WHERE c.deleted_at IS NULL
            """
            params = []
            if uid:
                query += " AND c.user_id = ?"
                params.append(uid)
            query += " ORDER BY c.id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            rows = conn.execute(query, params).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

    def get_campaign(self, campaign_id: int):
        with self._get_conn() as conn:
            row = conn.execute("""
                SELECT c.*, 
                       (SELECT COUNT(*) FROM send_log WHERE campaign_id = c.id AND status='sent') as sent_count,
                       (SELECT COUNT(*) FROM send_log WHERE campaign_id = c.id AND status='failed') as failed_count
                FROM campaigns c WHERE c.id = ?
            """, (campaign_id,)).fetchone()
            return dict(row) if row else None

    # --- Accounts ---
    def get_all_accounts(self, limit: int = 15, offset: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            # 1. Get count
            count_query = "SELECT COUNT(*) FROM accounts WHERE deleted_at IS NULL"
            count_params = []
            if uid:
                count_query += " AND user_id = ?"
                count_params.append(uid)
            
            total = conn.execute(count_query, count_params).fetchone()[0] or 0

            # 2. Get items
            query = "SELECT * FROM accounts WHERE deleted_at IS NULL"
            params = []
            if uid:
                query += " AND user_id = ?"
                params.append(uid)
            query += " ORDER BY id DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            rows = conn.execute(query, params).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

    def add_account(self, provider, email, **kwargs):
        uid = current_user_id.get()
        if uid is not None:
            kwargs["user_id"] = uid
            
        kwargs["provider"] = provider
        
        cols = ["email"] + list(kwargs.keys())
        vals = [email] + list(kwargs.values())
        
        placeholders = ", ".join(["?"] * len(cols))
        updates = ", ".join([f"{col}=excluded.{col}" for col in kwargs.keys()])
        
        query = f"""
            INSERT INTO accounts ({', '.join(cols)}) VALUES ({placeholders})
            ON CONFLICT(email, user_id) DO UPDATE SET {updates} RETURNING id
        """
        
        with self._get_conn() as conn:
            cursor = conn.execute(query, vals)
            conn.commit()
            return cursor.fetchone()[0] if cursor.rowcount > 0 else None

    # --- Analytics & Warmup ---
    def mark_opened(self, tracking_id, ip_address=None, user_agent=None):
        with self._get_conn() as conn:
            row = conn.execute("""
                SELECT s.id, s.sent_at, s.recipient, s.campaign_id, s.open_count, s.sender_ignore_until, a.email AS sender_email, c.is_test
                FROM send_log s
                LEFT JOIN accounts a ON s.account_id = a.id
                LEFT JOIN campaigns c ON s.campaign_id = c.id
                WHERE s.tracking_id = ?
            """, (tracking_id,)).fetchone()
            
            if row:
                import datetime as dt
                try:
                    # 1. Fetch current time and sent time
                    now = dt.datetime.utcnow()
                    sent_at_str = row['sent_at']
                    
                    # sent_at in SQLite might be "YYYY-MM-DD HH:MM:SS"
                    try:
                        sent_dt = dt.datetime.strptime(sent_at_str, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        # Fallback for ISO format if stored differently
                        sent_dt = dt.datetime.fromisoformat(sent_at_str.replace('Z', '+00:00')).replace(tzinfo=None)
                    
                    # 2. PER-EMAIL COOLDOWN LOGIC (60 Seconds)
                    # We ignore any hits within the first 60 seconds to block ISP scans/bots.
                    diff = (now - sent_dt).total_seconds()
                    
                    if diff < 60:
                        # Log the ignore to server console so user can see it's being "blocked" correctly
                        print(f"TRACKING: [IGNORED] Item {tracking_id} hit at {int(diff)}s (Cooldown active for 60s)")
                        return "ignored_initial_cooldown"

                    # 3. AFTER 60 SECONDS: 100% RELIABILITY
                    # We no longer apply aggressive filters (Internal IP, Proxy mismatch, Burst) 
                    # as they interfere with manual testing and real tracking stability.
                    
                    # We only increment aggregate counters on the very first open
                    is_first_open = (row['open_count'] == 0)
                    campaign_id = row['campaign_id']

                    # Always update the log with the latest hit, but don't re-mark 'opened' 
                    # for the aggregate if it was already marked.
                    conn.execute("""
                        UPDATE send_log 
                        SET opened = 1, open_count = open_count + 1, 
                            first_opened_at = COALESCE(first_opened_at, CURRENT_TIMESTAMP),
                            last_opened_at = CURRENT_TIMESTAMP
                        WHERE tracking_id = ?
                    """, (tracking_id,))
                    
                    if is_first_open and campaign_id:
                        conn.execute("UPDATE campaigns SET opened = opened + 1 WHERE id = ?", (campaign_id,))
                    
                    conn.execute("""
                        INSERT INTO tracking_events (tracking_id, event_type, ip_address, user_agent)
                        VALUES (?, 'open', ?, ?)
                    """, (tracking_id, ip_address, user_agent))
                    
                    print(f"TRACKING: [OPENED] Item {tracking_id} tracked successfully (Hit at {int(diff)}s)")
                    return "open"

                except Exception as e:
                    print(f"Tracking Logic Error: {e}")
                    import traceback
                    traceback.print_exc()
                    return None
            return None

    def log_warmup(self, account_id: int, emails_sent: int, target: int):
        success_rate = (emails_sent / target * 100) if target > 0 else 0
        with self._get_conn() as conn:
            day_number = self.get_warmup_day(account_id)
            conn.execute("""
                INSERT INTO warmup_log (account_id, day_number, emails_sent, target, success_rate)
                VALUES (?, ?, ?, ?, ?)
            """, (account_id, day_number, emails_sent, target, success_rate))

    def get_warmup_day(self, account_id: int) -> int:
        with self._get_conn() as conn:
            row = conn.execute("SELECT warmup_day FROM accounts WHERE id = ?", (account_id,)).fetchone()
            return row["warmup_day"] if row else 0

    def increment_warmup_day(self, account_id: int):
        with self._get_conn() as conn:
            conn.execute("UPDATE accounts SET warmup_day = warmup_day + 1 WHERE id = ?", (account_id,))

    def get_warmup_stats(self):
        """Returns aggregate stats for the warmup dashboard."""
        uid = current_user_id.get()
        with self._get_conn() as conn:
            where_acc = ""
            params_acc = []
            where_log = ""
            params_log = []
            
            if uid:
                where_acc = "AND user_id = ?"
                params_acc = [uid]
                where_log = "AND account_id IN (SELECT id FROM accounts WHERE user_id = ?)"
                params_log = [uid]

            # 1. Network Pool (active accounts)
            pool = conn.execute(f"SELECT COUNT(*) FROM accounts WHERE is_active = 1 {where_acc}", params_acc).fetchone()[0] or 0
            
            # 2. Avg Deliverability (past 30 days)
            avg_deliv = conn.execute(f"""
                SELECT AVG(success_rate) FROM warmup_log 
                WHERE date >= CURRENT_DATE - INTERVAL '30 days' {where_log}
            """, params_log).fetchone()[0] or 0.0
            
            # 3. Interactions Today
            today_count = conn.execute(f"""
                SELECT SUM(emails_sent) FROM warmup_log 
                WHERE date = CURRENT_DATE {where_log}
            """, params_log).fetchone()[0] or 0
            
            return {
                "network_pool": pool,
                "avg_deliverability": round(avg_deliv, 1),
                "interactions_today": today_count
            }

    def get_global_stats(self, time_range='today', account_id=None):
        """Returns stats for the dashboard filtered by time range."""
        uid = current_user_id.get()
        with self._get_conn() as conn:
            # First, total lifetime sent
            lt_query = "SELECT COUNT(*) FROM send_log WHERE status='sent' AND deleted_at IS NULL"
            lt_params = []
            if uid:
                lt_query += " AND account_id IN (SELECT id FROM accounts WHERE user_id=?)"
                lt_params.append(uid)
            if account_id:
                lt_query += " AND account_id = ?"
                lt_params.append(account_id)
            
            lifetime_total = conn.execute(lt_query, lt_params).fetchone()[0] or 0
            
            # Now, range stats
            where_clause = "WHERE deleted_at IS NULL "
            params = []
            if uid:
                where_clause += "AND account_id IN (SELECT id FROM accounts WHERE user_id=?) "
                params.append(uid)
            if account_id:
                where_clause += "AND account_id = ? "
                params.append(account_id)
                
            if time_range == 'today': # Rolling 24h
                where_clause += "AND sent_at >= NOW() - INTERVAL '1 day'"
            elif time_range == 'yesterday':
                where_clause += "AND sent_at >= NOW() - INTERVAL '2 days' AND sent_at < NOW() - INTERVAL '1 day'"
            elif time_range == '7d':
                where_clause += "AND sent_at >= NOW() - INTERVAL '7 days'"
            elif time_range == '30d':
                where_clause += "AND sent_at >= NOW() - INTERVAL '30 days'"
            elif time_range == '1y':
                where_clause += "AND sent_at >= NOW() - INTERVAL '1 year'"
            
            # Count filtered sent
            sent_query = "SELECT COUNT(*) FROM send_log " + where_clause + " AND status='sent'"
            opened_query = "SELECT COUNT(*) FROM send_log " + where_clause + " AND opened=1"
            failed_query = "SELECT COUNT(*) FROM send_log " + where_clause + " AND status='failed'"
            
            total_sent = conn.execute(sent_query, params).fetchone()[0] or 0
            total_opened = conn.execute(opened_query, params).fetchone()[0] or 0
            total_failed = conn.execute(failed_query, params).fetchone()[0] or 0
            
            open_rate = round((total_opened / total_sent * 100), 1) if total_sent > 0 else 0.0
            
            return {
                "total_sent": total_sent,
                "open_rate": open_rate,
                "total_opened": total_opened,
                "total_failed": total_failed,
                "lifetime_total": lifetime_total
            }
            
    def get_dispatch_history(self, time_range='7d', account_id=None):
        """Returns dispatched volume bucketed by time for charts."""
        uid = current_user_id.get()
        with self._get_conn() as conn:
            group_by = "DATE(sent_at)"
            where_clause = "WHERE deleted_at IS NULL "
            params = []
            
            if time_range == 'today': # Hourly for last 24h
                group_by = "date_trunc('hour', sent_at)"
                where_clause += "AND sent_at >= NOW() - INTERVAL '1 day' "
            elif time_range == '7d':
                group_by = "DATE(sent_at)"
                where_clause += "AND sent_at >= NOW() - INTERVAL '7 days' "
            elif time_range == '30d':
                group_by = "DATE(sent_at)"
                where_clause += "AND sent_at >= NOW() - INTERVAL '30 days' "
            elif time_range == '1y':
                group_by = "date_trunc('month', sent_at)"
                where_clause += "AND sent_at >= NOW() - INTERVAL '1 year' "
            elif time_range == 'forever':
                where_clause += "AND status='sent' "

            if uid:
                where_clause += "AND account_id IN (SELECT id FROM accounts WHERE user_id=?) "
                params.append(uid)
            if account_id:
                where_clause += "AND account_id = ? "
                params.append(account_id)
            
            query = f"""
                SELECT {group_by} as label, 
                       COUNT(*) as sent,
                       SUM(CASE WHEN opened=1 THEN 1 ELSE 0 END) as opens
                FROM send_log
                {where_clause}
                GROUP BY {group_by}
                ORDER BY {group_by} ASC
            """
            rows = conn.execute(query, params).fetchall()
            return [{"label": r["label"], "sent": r["sent"], "opens": r["opens"]} for r in rows]
            
    def get_recent_campaigns(self, limit=5):
        """Returns the most recent campaigns with stats."""
        uid = current_user_id.get()
        with self._get_conn() as conn:
            query = """
                SELECT id, name, created_at, status, total
                FROM campaigns WHERE deleted_at IS NULL
            """
            params = []
            if uid:
                query += " AND user_id = ?"
                params.append(uid)
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            
            rows = conn.execute(query, params).fetchall()
            
            res = []
            for r in rows:
                c_id = r["id"]
                sent = conn.execute("SELECT COUNT(*) FROM send_log WHERE campaign_id=? AND status='sent'", (c_id,)).fetchone()[0]
                opens = conn.execute("SELECT COUNT(*) FROM send_log WHERE campaign_id=? AND opened=1", (c_id,)).fetchone()[0]
                res.append({
                    "id": c_id,
                    "name": r["name"],
                    "created_at": r["created_at"],
                    "status": r["status"],
                    "sent": sent,
                    "opens": opens
                })
            return res

    # --- Templates ---
    def get_templates(self, limit: int = 15, offset: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            where = " WHERE deleted_at IS NULL"
            params = []
            if uid:
                where += " AND user_id = ?"
                params = [uid]
            
            count_query = f"SELECT COUNT(*) FROM templates {where}"
            total = conn.execute(count_query, params).fetchone()[0] or 0

            query = f"SELECT * FROM templates {where} ORDER BY created_at DESC LIMIT ? OFFSET ?"
            rows = conn.execute(query, params + [limit, offset]).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

    def add_template(self, name: str, subject: str, body_plain: str, body_html: str = "", use_html: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO templates (name, subject, body_plain, body_html, use_html, user_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, subject, body_plain, body_html, use_html, uid))
            conn.commit()

    def remove_template(self, template_id: int):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            conn.execute("DELETE FROM templates WHERE id = ? AND user_id = ?", (template_id, uid))
            conn.commit()

    # --- Blacklist ---
    def get_blacklist(self, limit: int = 15, offset: int = 0):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            where = ""
            params = []
            if uid:
                where = " WHERE user_id = ?"
                params = [uid]
            
            count_query = f"SELECT COUNT(*) FROM blacklist {where}"
            total = conn.execute(count_query, params).fetchone()[0] or 0

            query = f"SELECT * FROM blacklist {where} ORDER BY added_at DESC LIMIT ? OFFSET ?"
            rows = conn.execute(query, params + [limit, offset]).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

    def add_to_blacklist(self, email: str, reason: str = 'manual'):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO blacklist (email, reason, user_id)
                VALUES (?, ?, ?) ON CONFLICT (email, user_id) DO NOTHING
            """, (email.lower().strip(), reason, uid))
            conn.commit()

    def remove_from_blacklist(self, email: str):
        uid = current_user_id.get()
        with self._get_conn() as conn:
            conn.execute("DELETE FROM blacklist WHERE email = ? AND user_id = ?", (email, uid))
            conn.commit()

    # --- Trash & Soft Delete System ---
    def soft_delete_item(self, table: str, item_id: int):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    check = conn.execute("SELECT id FROM accounts WHERE user_id = ? AND id = (SELECT account_id FROM send_log WHERE id = ?)", (uid, item_id)).fetchone()
                    if not check: return False
                conn.execute("UPDATE send_log SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (item_id,))
            else:
                if uid:
                    conn.execute(f"UPDATE {table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (item_id, uid))
                else:
                    conn.execute(f"UPDATE {table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (item_id,))
            conn.commit()
            return True

    def restore_item(self, table: str, item_id: int):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    check = conn.execute("SELECT id FROM accounts WHERE user_id = ? AND id = (SELECT account_id FROM send_log WHERE id = ?)", (uid, item_id)).fetchone()
                    if not check: return False
                conn.execute("UPDATE send_log SET deleted_at = NULL WHERE id = ?", (item_id,))
            else:
                if uid:
                    conn.execute(f"UPDATE {table} SET deleted_at = NULL WHERE id = ? AND user_id = ?", (item_id, uid))
                else:
                    conn.execute(f"UPDATE {table} SET deleted_at = NULL WHERE id = ?", (item_id,))
            conn.commit()
            return True

    def hard_delete_item(self, table: str, item_id: int):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    check = conn.execute("SELECT id FROM accounts WHERE user_id = ? AND id = (SELECT account_id FROM send_log WHERE id = ?)", (uid, item_id)).fetchone()
                    if not check: return False
                conn.execute("DELETE FROM send_log WHERE id = ?", (item_id,))
            else:
                if uid:
                    conn.execute(f"DELETE FROM {table} WHERE id = ? AND user_id = ?", (item_id, uid))
                else:
                    conn.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
            conn.commit()
            return True

    def delete_all_items(self, table: str):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    conn.execute("UPDATE send_log SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL AND account_id IN (SELECT id FROM accounts WHERE user_id = ?)", (uid,))
                else:
                    conn.execute("UPDATE send_log SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL")
            else:
                if uid:
                    conn.execute(f"UPDATE {table} SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL AND user_id = ?", (uid,))
                else:
                    conn.execute(f"UPDATE {table} SET deleted_at = CURRENT_TIMESTAMP WHERE deleted_at IS NULL")
            conn.commit()
            return True

    def restore_all_items(self, table: str):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    conn.execute("UPDATE send_log SET deleted_at = NULL WHERE deleted_at IS NOT NULL AND account_id IN (SELECT id FROM accounts WHERE user_id = ?)", (uid,))
                else:
                    conn.execute("UPDATE send_log SET deleted_at = NULL WHERE deleted_at IS NOT NULL")
            else:
                if uid:
                    conn.execute(f"UPDATE {table} SET deleted_at = NULL WHERE deleted_at IS NOT NULL AND user_id = ?", (uid,))
                else:
                    conn.execute(f"UPDATE {table} SET deleted_at = NULL WHERE deleted_at IS NOT NULL")
            conn.commit()
            return True

    def empty_trash(self, table: str):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return False
        
        with self._get_conn() as conn:
            if table == "send_log":
                if uid:
                    conn.execute("DELETE FROM send_log WHERE deleted_at IS NOT NULL AND account_id IN (SELECT id FROM accounts WHERE user_id = ?)", (uid,))
                else:
                    conn.execute("DELETE FROM send_log WHERE deleted_at IS NOT NULL")
            else:
                if uid:
                    conn.execute(f"DELETE FROM {table} WHERE deleted_at IS NOT NULL AND user_id = ?", (uid,))
                else:
                    conn.execute(f"DELETE FROM {table} WHERE deleted_at IS NOT NULL")
            conn.commit()
            return True

    def get_trash(self, table: str, limit: int = 50, offset: int = 0):
        uid = current_user_id.get()
        valid_tables = ["campaigns", "accounts", "send_log", "templates"]
        if table not in valid_tables: return {"items": [], "total": 0}
        
        with self._get_conn() as conn:
            if table == "send_log":
                where = " WHERE deleted_at IS NOT NULL"
                params = []
                if uid:
                    where += " AND account_id IN (SELECT id FROM accounts WHERE user_id = ?)"
                    params.append(uid)
                total = conn.execute(f"SELECT COUNT(*) FROM send_log {where}", params).fetchone()[0] or 0
                query = f"SELECT * FROM send_log {where} ORDER BY deleted_at DESC LIMIT ? OFFSET ?"
                rows = conn.execute(query, params + [limit, offset]).fetchall()
            else:
                where = " WHERE deleted_at IS NOT NULL"
                params = []
                if uid:
                    where += " AND user_id = ?"
                    params.append(uid)
                total = conn.execute(f"SELECT COUNT(*) FROM {table} {where}", params).fetchone()[0] or 0
                query = f"SELECT * FROM {table} {where} ORDER BY deleted_at DESC LIMIT ? OFFSET ?"
                rows = conn.execute(query, params + [limit, offset]).fetchall()
                
            return {"items": [dict(r) for r in rows], "total": total}

    def cleanup_expired_trash(self):
        with self._get_conn() as conn:
            valid_tables = ["campaigns", "accounts", "send_log", "templates"]
            for table in valid_tables:
                conn.execute(f"DELETE FROM {table} WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '7 days'")
            conn.commit()

# Global Database Instance functions (used extensively by the FastAPI bridge and GUI apps)
_db_instance = None

def get_db() -> Database:
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance

def get_all_campaigns(limit: int = 15, offset: int = 0):
    return get_db().get_all_campaigns(limit, offset)

def get_campaign(campaign_id: int):
    return get_db().get_campaign(campaign_id)
    
def create_campaign(name, account_ids, rotation_mode, subject, body_plain, body_html, use_html, tracking_enabled, campaign_type='campaign', scheduled_at=None, is_test=False):
    return get_db().create_campaign(name, account_ids, rotation_mode, subject, body_plain, body_html, use_html, tracking_enabled, campaign_type, scheduled_at, is_test)

def update_campaign_progress(campaign_id, total, status):
    return get_db().update_campaign_progress(campaign_id, total, status)

def get_global_stats(time_range='today'):
    return get_db().get_global_stats(time_range)

def get_dispatch_history(time_range='7d'):
    return get_db().get_dispatch_history(time_range)

def get_recent_campaigns(limit=5):
    return get_db().get_recent_campaigns(limit)

def get_global_stats(time_range='today', account_id=None):
    return get_db().get_global_stats(time_range, account_id)

def get_dispatch_history(time_range='7d', account_id=None):
    return get_db().get_dispatch_history(time_range, account_id)

def get_all_accounts(limit=15, offset=0):
    return get_db().get_all_accounts(limit, offset)

def get_warmup_stats():
    return get_db().get_warmup_stats()

def add_account(provider, email, **kwargs):
    return get_db().add_account(provider, email, **kwargs)

def log_send(campaign_id, account_id, recipient, website, status, error_msg=None, tracking_id=None, row_data=None):
    return get_db().log_send(campaign_id, account_id, recipient, website, status, error_msg, tracking_id, row_data)

def get_send_log(campaign_id: int = None, account_id: int = None, tracking_status: str = 'all', limit: int = 15, offset: int = 0):
    return get_db().get_send_log(campaign_id, account_id, tracking_status, limit, offset)

def mark_opened(tracking_id, ip_address=None, user_agent=None):
    return get_db().mark_opened(tracking_id, ip_address, user_agent)

def get_blacklist(limit: int = 15, offset: int = 0):
    return get_db().get_blacklist(limit, offset)

def add_to_blacklist(email: str, reason: str = 'manual'):
    return get_db().add_to_blacklist(email, reason)

def remove_from_blacklist(email: str):
    return get_db().remove_from_blacklist(email)

def get_templates(limit: int = 15, offset: int = 0):
    return get_db().get_templates(limit, offset)

def add_template(name, subject, body_plain, body_html="", use_html=0):
    return get_db().add_template(name, subject, body_plain, body_html, use_html)

def remove_template(template_id: int):
    return get_db().remove_template(template_id)

def soft_delete_item(table: str, item_id: int):
    return get_db().soft_delete_item(table, item_id)

def restore_item(table: str, item_id: int):
    return get_db().restore_item(table, item_id)

def hard_delete_item(table: str, item_id: int):
    return get_db().hard_delete_item(table, item_id)

def empty_trash(table: str):
    return get_db().empty_trash(table)

def get_trash(table: str, limit: int = 50, offset: int = 0):
    return get_db().get_trash(table, limit, offset)

def cleanup_expired_trash():
    return get_db().cleanup_expired_trash()

def delete_all_items(table: str):
    return get_db().delete_all_items(table)

def restore_all_items(table: str):
    return get_db().restore_all_items(table)
