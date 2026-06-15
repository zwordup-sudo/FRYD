import os
from cryptography.fernet import Fernet

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "kzeaYGh7puL9-CpXi9EQXlecPVFCRycOaUbQXZojPFU=")

# Ensure valid Fernet key length
if not ENCRYPTION_KEY or len(ENCRYPTION_KEY) != 44:
    ENCRYPTION_KEY = "kzeaYGh7puL9-CpXi9EQXlecPVFCRycOaUbQXZojPFU="

fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(plain_text: str | None) -> str | None:
    if not plain_text:
        return plain_text
    try:
        return fernet.encrypt(plain_text.encode("utf-8")).decode("utf-8")
    except Exception as e:
        print(f"Encryption error: {e}")
        return plain_text

def decrypt_data(cipher_text: str | None) -> str | None:
    if not cipher_text:
        return cipher_text
    try:
        return fernet.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        # Fallback if text was stored plain-text before encryption was enabled
        return cipher_text
