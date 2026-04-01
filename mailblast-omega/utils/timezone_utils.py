from timezonefinder import TimezoneFinder
import pytz
from datetime import datetime

class TimezoneUtils:
    @staticmethod
    def detect_timezone_from_domain(domain: str) -> str:
        """
        Attempts to guess recipient timezone from domain TLD/geo.
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
        tld = str(domain).rsplit(".", 1)[-1].lower() if domain else "com"
        return TLD_TIMEZONE_MAP.get(tld, "UTC")

    @staticmethod
    def schedule_for_9am(domain: str) -> datetime:
        """Returns UTC datetime for 9:00 AM in recipient's detected timezone."""
        tz_name = TimezoneUtils.detect_timezone_from_domain(domain)
        tz = pytz.timezone(tz_name)
        local_9am = tz.localize(datetime.now(tz).replace(hour=9, minute=0, second=0, microsecond=0))
        now_local = datetime.now(tz)
        if local_9am <= now_local:
            from datetime import timedelta
            local_9am += timedelta(days=1)
        return local_9am.astimezone(pytz.utc)
