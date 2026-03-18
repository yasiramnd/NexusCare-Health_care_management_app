import os
import firebase_admin
from firebase_admin import credentials
from src.auth_service.firebase.config import Config


def init_firebase(required=False):
    """Initialise Firebase Admin SDK.

    When required is False, missing credentials do not crash app startup.
    This keeps CI smoke tests and non-auth endpoints working without a key.
    """
    if firebase_admin._apps:
        return True

    key_path = Config.FIREBASE_KEY_PATH
    if not key_path or not os.path.exists(key_path):
        if required:
            raise FileNotFoundError(
                f"Firebase service-account key not found at: {key_path!r}\n"
                "Set FIREBASE_KEY_PATH in backend/.env and place the JSON file there."
            )
        return False

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        return True
    except (PermissionError, OSError) as exc:
        if required:
            raise
        return False
