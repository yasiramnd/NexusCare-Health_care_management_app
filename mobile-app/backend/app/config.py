import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ── Auth DB (Supabase ap-south-1) ─────────────────────────────────────────
    # Stores the credentials table: user_id, firebase_uid, role, is_active
    AUTH_DB_CONFIG = {
        "host":     os.getenv("AUTH_DB_HOST"),
        "port":     os.getenv("AUTH_DB_PORT", 5432),
        "dbname":   os.getenv("AUTH_DB_NAME"),
        "user":     os.getenv("AUTH_DB_USER"),
        "password": os.getenv("AUTH_DB_PASSWORD"),
    }

    # ── Hospital DB (Supabase ap-southeast-2) ─────────────────────────────────
    # Stores all clinical tables: appointment, medical_record, prescription, etc.
    HOSPITAL_DB_CONFIG = {
        "host":     os.getenv("HOSPITAL_DB_HOST"),
        "port":     os.getenv("HOSPITAL_DB_PORT", 5432),
        "dbname":   os.getenv("HOSPITAL_DB_NAME"),
        "user":     os.getenv("HOSPITAL_DB_USER"),
        "password": os.getenv("HOSPITAL_DB_PASSWORD"),
        
    }
    

    # ── Firebase ──────────────────────────────────────────────────────────────
    FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", "firebase_service_key.json")

    # ── Supabase Storage (for QR images) ─────────────────────────────────────
    SUPABASE_URL    = os.getenv("SUPABASE_URL")
    SUPABASE_KEY    = os.getenv("SUPABASE_KEY")
    SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")
