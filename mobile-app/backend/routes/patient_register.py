from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_auth
from app.db.auth_db import get_auth_conn, put_auth_conn
from app.db.hospital_db import get_hospital_conn, put_hospital_conn
from utils.qr_generator import generate_and_upload_qr

patient_register_bp = Blueprint("patient_register_bp", __name__)


@patient_register_bp.route("/patient/register", methods=["POST"])
def register_patient():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    contact_no1 = data.get("contact_no1")
    contact_no2 = data.get("contact_no2")
    address = data.get("address")
    nic = data.get("nic")
    date_of_birth = data.get("date_of_birth")
    gender = data.get("gender")

    contact_name = data.get("contact_name")
    contact_phone = data.get("contact_phone")
    blood_group = data.get("blood_group", "Unknown")
    allergies = data.get("allergies")
    chronic_conditions = data.get("chronic_conditions")
    is_public_visible = data.get("is_public_visible", False)

    auth_conn = get_auth_conn()
    hospital_conn = get_hospital_conn()
    firebase_uid = None

    try:
        # ✅ Firebase user
        firebase_user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name
        )
        firebase_uid = firebase_user.uid

        # ✅ HOSPITAL DB TRANSACTION
        with hospital_conn.cursor() as cur:

            # 🔹 1. Insert user → get user_id
            cur.execute("""
                INSERT INTO users (name, contact_no1, contact_no2, address)
                VALUES (%s, %s, %s, %s)
                RETURNING user_id;
            """, (name, contact_no1, contact_no2, address))

            user_id = cur.fetchone()["user_id"]

            # 🔹 2. Insert patient → get patient_id
            cur.execute("""
                INSERT INTO patient (user_id, nic, date_of_birth, gender)
                VALUES (%s, %s, %s, %s)
                RETURNING patient_id;
            """, (user_id, nic, date_of_birth, gender))

            patient_id = cur.fetchone()["patient_id"]

            #   3. Generate QR code
            qr_url = generate_and_upload_qr(patient_id, cur)
            if qr_url:
                print("QR Generated Successfully to ",patient_id)
            else:
                print("Failed to generate QR")


            # 🔹 4. Insert emergency_profile
            cur.execute("""
                INSERT INTO emergency_profile
                (patient_id, contact_name, contact_phone, blood_group,
                 allergies, chronic_conditions, is_public_visible)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                patient_id,
                contact_name,
                contact_phone,
                blood_group,
                allergies,
                chronic_conditions,
                is_public_visible
            ))

        hospital_conn.commit()

        # ✅ AUTH DB
        with auth_conn.cursor() as cur:
            cur.execute("""
                INSERT INTO credentials
                (user_id, username, email, password_hash, firebase_uid, role, is_active)
                VALUES (%s, %s, %s, NULL, %s, 'PATIENT', TRUE)
            """, (
                user_id,
                email.split("@")[0],
                email,
                firebase_uid
            ))

        auth_conn.commit()

    except Exception as e:
        _cleanup(auth_conn, hospital_conn, firebase_uid)
        return jsonify({"error": str(e)}), 500

    finally:
        put_auth_conn(auth_conn)
        put_hospital_conn(hospital_conn)

    return jsonify({
        "message": "Patient registered successfully",
        "user_id": user_id,
        "patient_id": patient_id,
        "firebase_uid": firebase_uid
    }), 201


def _cleanup(auth_conn, hospital_conn, firebase_uid):
    try:
        auth_conn.rollback()
    except:
        pass

    try:
        hospital_conn.rollback()
    except:
        pass

    if firebase_uid:
        try:
            firebase_auth.delete_user(firebase_uid)
        except:
            pass