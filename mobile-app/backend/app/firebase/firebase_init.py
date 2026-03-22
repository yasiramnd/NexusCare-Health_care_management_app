import firebase_admin
from firebase_admin import credentials
from app.config import Config


def init_firebase():
    """Initialise Firebase Admin SDK once (singleton guard)."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(Config.FIREBASE_KEY_PATH)
        firebase_admin.initialize_app(cred)
