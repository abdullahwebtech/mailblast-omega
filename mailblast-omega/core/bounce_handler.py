import imaplib
import email as email_lib
import re

class BounceHandler:
    def __init__(self, imap_config: dict, db):
        self.config = imap_config
        self.db = db

    def scan_bounces(self) -> int:
        """
        Connects to IMAP, scans for bounce/NDR emails,
        extracts failed addresses, adds to blacklist.
        Returns count of new bounces found.
        """
        bounces_found = 0
        
        try:
            with imaplib.IMAP4_SSL(self.config["imap_host"], self.config["imap_port"]) as mail:
                mail.login(self.config["username"], self.config["password"])
                mail.select("INBOX")
                
                # Search for delivery failure messages
                _, message_nums = mail.search(None,
                    '(OR SUBJECT "Mail delivery failed" SUBJECT "Delivery Status Notification" '
                    'SUBJECT "Undeliverable" SUBJECT "failure notice" FROM "mailer-daemon")'
                )
                
                if message_nums and message_nums[0]:
                    for num in message_nums[0].split():
                        _, msg_data = mail.fetch(num, "(RFC822)")
                        raw = msg_data[0][1]
                        msg = email_lib.message_from_bytes(raw)
                        
                        # Extract failed address from bounce body
                        body = self._get_body(msg)
                        failed_emails = self._extract_failed_addresses(body)
                        
                        for failed_email in failed_emails:
                            self.db.add_to_blacklist(failed_email, reason="bounced")
                            bounces_found += 1
        except Exception as e:
            print(f"Error checking bounces: {e}")
            
        return bounces_found

    def _get_body(self, msg) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype == 'text/plain':
                    return part.get_payload(decode=True).decode('utf-8', 'ignore')
        else:
            return msg.get_payload(decode=True).decode('utf-8', 'ignore')
        return ""

    def _extract_failed_addresses(self, text: str) -> list[str]:
        EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
        # Look near bounce indicators
        bounce_patterns = [
            r"(?:failed|undeliverable|unknown user)[^\n]*?(" + EMAIL_RE.pattern + r")",
            r"To:\s*(" + EMAIL_RE.pattern + r")",
            r"Original-Recipient:[^\n]*?(" + EMAIL_RE.pattern + r")",
        ]
        found = set()
        for pattern in bounce_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            found.update(matches)
        return list(found)

