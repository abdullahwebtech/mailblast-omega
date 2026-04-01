import time
import random

WARMUP_SCHEDULE = {
    # day: emails_to_send
    1:  5,   2:  8,   3:  12,  4:  18,  5:  25,
    6:  35,  7:  48,  8:  65,  9:  85,  10: 110,
    11: 140, 12: 175, 13: 215, 14: 260, 15: 310,
    16: 365, 17: 425, 18: 490, 19: 560, 20: 635,
    21: 715, 22: 800, 23: 890, 24: 985, 25: 1000,  # max
}

class WarmUpEngine:
    """
    Sends warm-up emails to a seed list (internal addresses or
    a warm-up service like Mailreach/Lemwarm seed addresses).
    
    Each warm-up email is sent AND auto-replied to (from seed addresses)
    to signal positive engagement to ESP algorithms.
    """
    def __init__(self, account, db, seed_list: list[str]):
        self.account = account
        self.db = db
        self.seed_list = seed_list

    def get_today_target(self, account_id: int) -> int:
        warmup_day = self.db.get_warmup_day(account_id)
        if warmup_day == 0:
            warmup_day = 1 # start at day 1
            self.db.increment_warmup_day(account_id)
        return WARMUP_SCHEDULE.get(warmup_day, 1000)

    def run_daily_warmup(self, account_id: int):
        if not self.seed_list:
            return 0
            
        target = self.get_today_target(account_id)
        sent = 0
        for i in range(target):
            seed_email = self.seed_list[i % len(self.seed_list)]
            # Send warm-up email with random subject/body
            subject = self._random_subject()
            body = self._random_body()
            result = self.account.send_email(seed_email, subject, body, html=False)
            if result["status"] == "sent":
                sent += 1
            time.sleep(random.uniform(30, 120))  # slow pace for warm-up
        
        self.db.log_warmup(account_id, sent, target)
        self.db.increment_warmup_day(account_id)
        return sent

    def _random_subject(self) -> str:
        subjects = [
            "Quick catch-up", "Following up", "Hey there",
            "Check this out", "FYI", "Thoughts?", "Re: our chat",
            "Are we still on?", "Meeting notes", "Checking in"
        ]
        return random.choice(subjects)

    def _random_body(self) -> str:
        words = ["Great to see you yesterday.", "Let's connect next week.", 
                 "Did you see the new update?", "I will be sending the report shortly.", 
                 "Thanks for your help with the project.", "Hope your week is going well.",
                 "Can we schedule a quick call?"]
        return " ".join(random.sample(words, k=3)) + "\n\nBest,\n"
