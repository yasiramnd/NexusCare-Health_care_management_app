# ==========================================
# QR Generator Utility
# Generate → Upload → Save URL in DB
# ==========================================

import os
import psycopg2
import qrcode
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# ==========================
# Environment Configuration
# ==========================

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")

# Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================
# QR Folder Setup
# ==========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QR_FOLDER = os.path.join(BASE_DIR, "qr_images")
os.makedirs(QR_FOLDER, exist_ok=True)


# ==========================
# Check Patient Exists
# ==========================

def patient_exists(patient_id):
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM patient WHERE patient_id = %s;", (patient_id,))
    result = cur.fetchone()

    cur.close()
    conn.close()

    return result is not None


# ==========================
# Generate QR Image
# ==========================

def generate_qr_image(patient_id):

    url = f"http://nexuscare.lk/emergency/{patient_id}"

    filename = f"{patient_id}.png"
    file_path = os.path.join(QR_FOLDER, filename)

    img = qrcode.make(url)
    img.save(file_path)

    return file_path, filename


# ==========================
# Upload to Supabase
# ==========================

def upload_to_supabase(file_path, filename):

    with open(file_path, "rb") as file:
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            filename,
            file,
            {"content-type": "image/png"}
        )

    public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(filename)

    return public_url


# ==========================
# Update DB
# ==========================

def update_qr_url(patient_id, qr_url):

    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    cur = conn.cursor()

    cur.execute(
        "UPDATE patient SET qr_code = %s WHERE patient_id = %s;",
        (qr_url, patient_id)
    )

    conn.commit()
    cur.close()
    conn.close()


# ==========================
# MAIN FUNCTION (Reusable)
# ==========================

def generate_and_upload_qr(patient_id):

    try:
        if not patient_exists(patient_id):
            print("Patient not found")
            return None

        # Generate QR
        file_path, filename = generate_qr_image(patient_id)

        # Upload
        qr_url = upload_to_supabase(file_path, filename)

        # Update DB
        update_qr_url(patient_id, qr_url)

        # ✅ Delete local file after upload
        if os.path.exists(file_path):
            os.remove(file_path)

        return qr_url

    except Exception as e:
        print("Error:", e)
        return None