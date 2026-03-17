# ==========================================
# Generate QR → Save in qr_images folder
# → Upload to Supabase
# → Update qr_code column in patients table
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

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================
# Define QR Save Location
# ==========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QR_FOLDER = os.path.join(BASE_DIR, "qr_images")

# Create folder if it does not exist
os.makedirs(QR_FOLDER, exist_ok=True)


# ==========================
# Check if Patient Exists
# ==========================

def patient_exists(patient_id):
    connection = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )

    cursor = connection.cursor()
    cursor.execute("SELECT 1 FROM patient WHERE patient_id = %s;", (patient_id,))
    result = cursor.fetchone()

    cursor.close()
    connection.close()

    return result is not None


# ==========================
# Generate QR Code Image
# ==========================

def generate_qr_image(patient_id):

    emergency_url = f"http://nexuscare.lk/emergency/{patient_id}"

    filename = f"{patient_id}.png"
    file_path = os.path.join(QR_FOLDER, filename)

    img = qrcode.make(emergency_url)
    img.save(file_path)

    return file_path, filename


# ==========================
# Upload to Supabase Storage
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
# Update qr_code Column
# ==========================

def update_qr_url(patient_id, qr_url):

    connection = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )

    cursor = connection.cursor()

    cursor.execute(
        "UPDATE patient SET qr_code = %s WHERE patient_id = %s;",
        (qr_url, patient_id)
    )

    connection.commit()

    cursor.close()
    connection.close()


# ==========================
# Main Execution
# ==========================

def main():

    patient_id = input("Enter patient ID: ").strip()

    if not patient_exists(patient_id):
        print("Patient not found.")
        return

    # Step 1: Generate QR
    file_path, filename = generate_qr_image(patient_id)

    # Step 2: Upload to Supabase
    qr_url = upload_to_supabase(file_path, filename)

    # Step 3: Update database
    update_qr_url(patient_id, qr_url)

    # Optional: remove local file after upload
    # os.remove(file_path)

    print("QR successfully generated.")
    print("Saved locally at:", file_path)
    print("Supabase URL:", qr_url)


if __name__ == "__main__":
    main()