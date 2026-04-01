import msal
import requests
import json
import os

CLIENT_ID = "YOUR_OUTLOOK_CLIENT_ID_HERE"
TENANT_ID = "common"
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = ["Mail.Send", "offline_access"]
CREDENTIALS_FILE = "credentials/outlook_credentials.json"

class OutlookClient:
    def __init__(self, account_id: int, email: str, token_path: str):
        self.account_id = account_id
        self.email = email
        self.token_path = token_path
        self.access_token = None
        self.app = msal.PublicClientApplication(
            CLIENT_ID, authority=AUTHORITY,
            token_cache=self._load_cache()
        )
        self._authenticate()

    def _load_cache(self):
        cache = msal.SerializableTokenCache()
        if os.path.exists(self.token_path):
            cache.deserialize(open(self.token_path, "r").read())
        return cache

    def _save_cache(self, cache):
        if cache.has_state_changed:
            with open(self.token_path, "w") as f:
                f.write(cache.serialize())

    def _authenticate(self):
        accounts = self.app.get_accounts()
        result = None
        if accounts:
            result = self.app.acquire_token_silent(SCOPES, account=accounts[0])
            
        if not result:
            print(f"No valid token for Outlook account {self.email}. Please authenticate.")
            # In a real GUI, this would trigger device flow or interactive login
            # Here we use device flow for CLI fallback if needed
            flow = self.app.initiate_device_flow(scopes=SCOPES)
            if "user_code" in flow:
                print(flow["message"])
                result = self.app.acquire_token_by_device_flow(flow)

        if "access_token" in result:
            self.access_token = result["access_token"]
            self._save_cache(self.app.token_cache)
        else:
            raise Exception("Could not authenticate Outlook client")

    def send_email(self, to_email: str, subject: str, body: str, html: bool = False):
        if not self.access_token:
            return {"status": "failed", "error": "No access token"}

        endpoint = "https://graph.microsoft.com/v1.0/me/sendMail"
        email_msg = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML" if html else "Text",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ]
            },
            "saveToSentItems": "true"
        }
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(endpoint, headers=headers, json=email_msg)
        if response.status_code == 202:
            return {"status": "sent"}
        else:
            return {"status": "failed", "error": response.text}
