import threading
import time
import random

def interruptible_sleep(stop_event: threading.Event, seconds: float, step: float = 0.1):
    """Bug #9 Fix: Prevents time.sleep from blocking the stop_event check"""
    elapsed = 0
    while elapsed < seconds and not stop_event.is_set():
        time.sleep(step)
        elapsed += step

class OmegaSender:
    """
    Unrestricted sender. No rate cap. No daily limit.
    Sends as fast as the SMTP server allows.
    Optional: minimal delay to avoid SMTP connection errors.
    """
    def __init__(self, clients: list, campaign_id: int, df,
                 subject: str, body: str, use_html: bool,
                 tracking_enabled: bool, tracking_server_url: str,
                 rotation_mode: str, stop_event: threading.Event,
                 db, on_progress, on_complete,
                 min_delay: float = 0.0, max_delay: float = 0.0):
        self.clients = clients
        self.campaign_id = campaign_id
        self.df = df
        self.subject = subject
        self.body = body
        self.use_html = use_html
        self.tracking_enabled = tracking_enabled
        self.tracking_server_url = tracking_server_url
        self.rotation_mode = rotation_mode
        self.stop_event = stop_event
        self.db = db
        self.on_progress = on_progress
        self.on_complete = on_complete
        self.min_delay = min_delay  # default 0 — no delay
        self.max_delay = max_delay
        self._client_index = 0

    def run(self):
        total = len(self.df)
        sent = 0
        failed = 0

        # Pre-filter blacklisted emails
        blacklist = self.db.get_blacklist_set()
        
        for idx, row in self.df.iterrows():
            if self.stop_event.is_set():
                break

            website = str(row.get("Website", ""))
            emails_raw = str(row.get("Emails", "") if "Emails" in row else row.get("Email", ""))
            emails = self._parse_emails(emails_raw)
            
            # fallback if columns are different
            if not emails:
                for col in row.keys():
                    if "email" in str(col).lower():
                        emails += self._parse_emails(str(row.get(col, "")))

            if not emails:
                continue

            for email in emails:
                if self.stop_event.is_set():
                    break
                
                # Skip blacklisted
                if email.lower() in blacklist:
                    self.db.log_send(self.campaign_id, None, email, website, "skipped", "Blacklisted")
                    continue

                client = self._get_next_client()
                tracking_id = None
                
                # Render variables
                context = {col: str(row.get(col, "")) for col in self.df.columns}
                from core.template_engine import render_template, process_spintax
                rendered_subject = process_spintax(render_template(self.subject, context))
                rendered_body    = process_spintax(render_template(self.body, context))

                # Inject tracking
                if self.tracking_enabled and self.use_html:
                    from tracking.pixel import generate_tracking_id, inject_tracking_pixel, inject_click_tracking, get_unsub_link
                    tracking_id = generate_tracking_id()
                    rendered_body = inject_tracking_pixel(rendered_body, tracking_id, self.tracking_server_url)
                    rendered_body = inject_click_tracking(rendered_body, tracking_id, self.tracking_server_url)
                    unsub_link = get_unsub_link(tracking_id, self.tracking_server_url)
                    rendered_body = rendered_body.replace("{UnsubLink}", unsub_link)

                # Send
                # Note replacing Bug #10 here mentally if it existed, but client.send_email handles it well now.
                result = client.send_email(email, rendered_subject, rendered_body, html=self.use_html)
                self.db.log_send(self.campaign_id, client.account_id, email,
                                 website, result["status"], result.get("error"), tracking_id)

                if result["status"] == "sent":
                    sent += 1
                else:
                    failed += 1
                    err_msg = str(result.get("error",""))
                    if "550" in err_msg:
                        self.db.add_to_blacklist(email, "hard_bounce")

                # Bug #12 Fix via UI caller checking after, but just cleanly raising it to the thread handler
                self.on_progress(sent, failed, total, email, result["status"])

                # Optional minimal delay (default 0)
                if self.max_delay > 0:
                    interruptible_sleep(self.stop_event, random.uniform(self.min_delay, self.max_delay))

        self.on_complete(sent, failed, total)

    def _get_next_client(self):
        """Returns next client based on rotation mode."""
        if len(self.clients) == 0:
            raise Exception("No active sending clients found")
        if len(self.clients) == 1:
            return self.clients[0]
        if self.rotation_mode == "round_robin":
            client = self.clients[self._client_index % len(self.clients)]
            self._client_index += 1
            return client
        elif self.rotation_mode == "random":
            return random.choice(self.clients)
        return self.clients[0]

    def _parse_emails(self, raw: str) -> list:
        import re
        EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
        return [e.strip() for e in str(raw).split(",") if EMAIL_RE.match(e.strip())]
