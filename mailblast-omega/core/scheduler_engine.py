from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger
from timezonefinder import TimezoneFinder
from datetime import datetime, timezone
import pytz

class SchedulerEngine:
    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone="UTC")
        if not self.scheduler.running:
            self.scheduler.start()
        self._reload_jobs()

    def _reload_jobs(self):
        """Reloads pending jobs from the database on startup."""
        from data.db import get_db
        db = get_db()
        with db._get_conn() as conn:
            jobs = conn.execute("SELECT * FROM scheduled_jobs WHERE status = 'pending'").fetchall()
            for job in jobs:
                # We'll re-add them if they are still in the future
                # Ensure we handle Z suffix and comparison
                dt_str = job['scheduled_at'].replace('Z', '+00:00')
                dt = datetime.fromisoformat(dt_str)
                if dt > datetime.now(timezone.utc):
                    self._add_to_apscheduler(job['id'], job['campaign_id'], dt)
                else:
                    # Mark stale jobs as missed or handled elsewhere
                    conn.execute("UPDATE scheduled_jobs SET status = 'missed' WHERE id = ?", (job['id'],))

    def _add_to_apscheduler(self, job_record_id, campaign_id, run_at_utc):
        from api_bridge import run_campaign_async
        self.scheduler.add_job(
            func=self._execute_scheduled_job,
            trigger=DateTrigger(run_date=run_at_utc),
            args=[job_record_id, campaign_id],
            id=f"job_{job_record_id}",
            misfire_grace_time=3600
        )

    def _execute_scheduled_job(self, job_record_id, campaign_id):
        from data.db import get_db
        from api_bridge import run_campaign_async
        db = get_db()
        
        # Update status to running
        with db._get_conn() as conn:
            conn.execute("UPDATE scheduled_jobs SET status = 'running' WHERE id = ?", (job_record_id,))
            conn.commit()
            
        # Run the campaign
        try:
            run_campaign_async(campaign_id)
            with db._get_conn() as conn:
                conn.execute("UPDATE scheduled_jobs SET status = 'done' WHERE id = ?", (job_record_id,))
        except Exception as e:
            print(f"Scheduled job {job_record_id} failed: {e}")
            with db._get_conn() as conn:
                conn.execute("UPDATE scheduled_jobs SET status = 'failed' WHERE id = ?", (job_record_id,))

    def schedule_campaign(self, campaign_id: int, run_at_utc: datetime):
        from data.db import get_db
        db = get_db()
        with db._get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO scheduled_jobs (campaign_id, scheduled_at, status) VALUES (?, ?, ?)",
                (campaign_id, run_at_utc.isoformat(), "pending")
            )
            job_record_id = cursor.lastrowid
            
        self._add_to_apscheduler(job_record_id, campaign_id, run_at_utc)
        return job_record_id

    def cancel_job(self, job_record_id: int):
        from data.db import get_db
        db = get_db()
        try:
            self.scheduler.remove_job(f"job_{job_record_id}")
        except:
            pass
        with db._get_conn() as conn:
            conn.execute("UPDATE scheduled_jobs SET status = 'cancelled' WHERE id = ?", (job_record_id,))

    def list_jobs(self, limit: int = 15, offset: int = 0):
        from data.db import get_db, current_user_id
        db = get_db()
        uid = current_user_id.get()
        with db._get_conn() as conn:
            where = "WHERE s.status IN ('pending', 'running')"
            params = []
            if uid:
                where += " AND c.user_id = ?"
                params = [uid]
            
            # Get total
            count_query = f"""
                SELECT COUNT(*) 
                FROM scheduled_jobs s
                JOIN campaigns c ON s.campaign_id = c.id
                {where}
            """
            total = conn.execute(count_query, params).fetchone()[0] or 0

            # Get items
            query = f"""
                SELECT s.*, c.name as campaign_name, c.campaign_type
                FROM scheduled_jobs s
                JOIN campaigns c ON s.campaign_id = c.id
                {where}
                ORDER BY s.scheduled_at ASC
                LIMIT ? OFFSET ?
            """
            rows = conn.execute(query, params + [limit, offset]).fetchall()
            return {"items": [dict(r) for r in rows], "total": total}

def detect_timezone_from_domain(domain: str) -> str:
    """
    Attempts to guess recipient timezone from domain TLD/geo.
    Falls back to UTC if TLD is generic and not mapped.
    """
    TLD_TIMEZONE_MAP = {
        "pk": "Asia/Karachi",
        "uk": "Europe/London",
        "gb": "Europe/London",
        "de": "Europe/Berlin",
        "fr": "Europe/Paris",
        "au": "Australia/Sydney",
        "ca": "America/Toronto",
        "in": "Asia/Kolkata",
        "ae": "Asia/Dubai",
        "sa": "Asia/Riyadh",
        "jp": "Asia/Tokyo",
        "br": "America/Sao_Paulo",
        "mx": "America/Mexico_City",
        "sg": "Asia/Singapore",
        "za": "Africa/Johannesburg",
        "ng": "Africa/Lagos",
        "eg": "Africa/Cairo",
        "us": "America/New_York",
        "com": "America/New_York", 
    }
    tld = str(domain).rsplit(".", 1)[-1].lower()
    return TLD_TIMEZONE_MAP.get(tld, "UTC")

def schedule_for_9am(domain: str) -> datetime:
    """Returns UTC datetime for 9:00 AM in recipient's detected timezone."""
    tz_name = detect_timezone_from_domain(domain)
    tz = pytz.timezone(tz_name)
    local_9am = tz.localize(datetime.now(tz).replace(hour=9, minute=0, second=0, microsecond=0))
    # If 9am today already passed, schedule for tomorrow
    now_local = datetime.now(tz)
    if local_9am <= now_local:
        from datetime import timedelta
        local_9am += timedelta(days=1)
    return local_9am.astimezone(pytz.utc)
