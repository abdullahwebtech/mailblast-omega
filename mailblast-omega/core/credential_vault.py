from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

class CredentialVault:
    def __init__(self):
        load_dotenv()
        self.key_str = os.getenv("ENCRYPTION_KEY", "").strip()
        if not self.key_str:
            self.key = Fernet.generate_key()
            self._save_new_key(self.key.decode())
        else:
            self.key = self.key_str.encode()
        self.cipher = Fernet(self.key)

    def _save_new_key(self, key_str: str):
        # Update .env
        env_path = ".env"
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()
        
        with open(env_path, "w") as f:
            key_set = False
            for line in lines:
                if line.startswith("ENCRYPTION_KEY="):
                    f.write(f"ENCRYPTION_KEY={key_str}\n")
                    key_set = True
                else:
                    f.write(line)
            if not key_set:
                f.write(f"\nENCRYPTION_KEY={key_str}\n")

    def encrypt(self, plain_text: str) -> str:
        if not plain_text: return ""
        return self.cipher.encrypt(plain_text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        if not encrypted_text: return ""
        try:
            return self.cipher.decrypt(encrypted_text.encode()).decode()
        except:
            return ""

vault = CredentialVault()

def encrypt_password(password: str) -> str:
    return vault.encrypt(password)

def decrypt_password(enc: str) -> str:
    return vault.decrypt(enc)
