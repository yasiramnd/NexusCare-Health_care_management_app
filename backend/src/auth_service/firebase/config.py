import os
from pathlib import Path
from dotenv import load_dotenv

# Always load backend/.env regardless of current working directory.
_BACKEND_DIR = Path(__file__).resolve().parents[3]
load_dotenv(dotenv_path=_BACKEND_DIR / ".env")

class Config:
    AUTH_DB_CONFIG = {
        "host": os.getenv("AUTH_DB_HOST"),
        "port": os.getenv("AUTH_DB_PORT"),
        "dbname": os.getenv("AUTH_DB_NAME"),
        "user": os.getenv("AUTH_DB_USER"),
        "password": os.getenv("AUTH_DB_PASSWORD"),
        "sslmode": "require",
    }

    HOSPITAL_DB_CONFIG = {
        "host": os.getenv("HOSPITAL_DB_HOST"),
        "port": os.getenv("HOSPITAL_DB_PORT"),
        "dbname": os.getenv("HOSPITAL_DB_NAME"),
        "user": os.getenv("HOSPITAL_DB_USER"),
        "password": os.getenv("HOSPITAL_DB_PASSWORD"),
        "sslmode": "require",
    }

    FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH")
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")