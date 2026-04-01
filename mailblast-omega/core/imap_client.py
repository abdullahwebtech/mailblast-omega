import smtplib
from email.message import EmailMessage
from core.credential_vault import decrypt_password

class GenericSMTPClient:
    def __init__(self, account_id: int, email: str, username: str, encrypted_pass: str, 
                 smtp_host: str, smtp_port: int, smtp_security: str):
        self.account_id = account_id
        self.email = email
        self.username = username or email
        self.password = decrypt_password(encrypted_pass)
        self.host = smtp_host
        self.port = smtp_port
        self.security = smtp_security

    def send_email(self, to_email: str, subject: str, body: str, html: bool = False):
        try:
            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = self.email
            msg['To'] = to_email
            
            if html:
                msg.set_content(body, subtype='html')
            else:
                msg.set_content(body)

            server = smtplib.SMTP(self.host, self.port, timeout=30)
            if "TLS" in self.security.upper():
                server.starttls()
                
            server.login(self.username, self.password)
            server.send_message(msg)
            server.quit()
            
            return {"status": "sent"}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

class IMAPClient(GenericSMTPClient):
    pass

class YahooClient(GenericSMTPClient):
    """Yahoo/AOL requires app passwords."""
    def __init__(self, account_id: int, email: str, username: str, encrypted_pass: str, **kwargs):
        super().__init__(account_id, email, username, encrypted_pass, "smtp.mail.yahoo.com", 587, "STARTTLS")
