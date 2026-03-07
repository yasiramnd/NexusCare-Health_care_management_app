import os
import firebase_admin
from firebase_admin import credentials
from src.auth_service.firebase.config import Config


def init_firebase():
    """Initialise Firebase Admin SDK (idempotent – safe to call multiple times)."""
    if firebase_admin._apps:
        return  # already initialised

    key_path = Config.FIREBASE_KEY_PATH
    if not key_path or not os.path.exists(key_path):
        raise FileNotFoundError(
            f"Firebase service-account key not found at: {key_path!r}\n"
            "Set FIREBASE_KEY_PATH in backend/.env and place the JSON file there."
        )

    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
