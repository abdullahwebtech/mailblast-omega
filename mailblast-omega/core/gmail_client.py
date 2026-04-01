import os
import base64
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = 'credentials/gmail_credentials.json'

class GmailClient:
    def __init__(self, account_id: int, email: str, token_path: str):
        self.account_id = account_id
        self.email = email
        self.token_path = token_path
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Bug #11 Fix: Auto-refresh expired tokens properly"""
        creds = None
        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)
            
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(self.token_path, 'w') as f:
                    f.write(creds.to_json())
            else:
                if not os.path.exists(CREDENTIALS_FILE):
                    raise FileNotFoundError(f"Missing {CREDENTIALS_FILE} for OAuth setup.")
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
                with open(self.token_path, 'w') as f:
                    f.write(creds.to_json())
                    
        self.service = build('gmail', 'v1', credentials=creds)

    def send_email(self, to_email: str, subject: str, body: str, html: bool = False):
        try:
            message = EmailMessage()
            message['To'] = to_email
            message['From'] = self.email
            message['Subject'] = subject
            
            if html:
                message.set_content(body, subtype='html')
            else:
                message.set_content(body)

            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': encoded_message}

            send_message = (self.service.users().messages()
                            .send(userId="me", body=create_message).execute())
            
            return {"status": "sent"}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

def get_oauth_url() -> str:
    """Returns OAuth URL for headless/web server mode."""
    if not os.path.exists(CREDENTIALS_FILE):
        return ""
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
    flow.redirect_uri = "http://localhost:3000/api/auth/gmail/callback"
    auth_url, _ = flow.authorization_url(prompt='consent')
    return auth_url
