from flask import Blueprint, request, jsonify, g
import requests as http_requests
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn
from src.auth_service.auth.middleware import token_required, role_required
from src.auth_service.firebase.config import Config

# =====================================
# Blueprint Setup
# =====================================
auth_bp = Blueprint("auth_bp", __name__)
admin_bp = Blueprint("admin_bp", __name__)

VALID_ROLES = {"ADMIN", "DOCTOR", "PATIENT", "LAB", "PHARMACY"}

FIREBASE_SIGN_IN_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
)
FIREBASE_SIGN_UP_URL = (
    "https://identitytoolkit.googleapis.com/v1/accounts:signUp"
)


# =====================================
# LOGIN USER  (email/password via Firebase REST API)
# =====================================
@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}

    # Frontend sends "identifier" (could be email) and "password"
    email = data.get("email") or data.get("identifier") or ""
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    api_key = Config.FIREBASE_API_KEY
    if not api_key:
        return jsonify({"error": "Server misconfiguration: FIREBASE_API_KEY not set"}), 500

    # 1) Authenticate with Firebase REST API
    try:
        fb_resp = http_requests.post(
            FIREBASE_SIGN_IN_URL,
            params={"key": api_key},
            json={
                "email": email,
                "password": password,
                "returnSecureToken": True,
            },
            timeout=10,
        )
    except http_requests.RequestException:
        return jsonify({"error": "Unable to reach Firebase authentication service"}), 503

    if fb_resp.status_code != 200:
        fb_error = {}
        try:
            fb_error = fb_resp.json().get("error", {})
        except ValueError:
            pass
        msg = fb_error.get("message", "Authentication failed")
        return jsonify({"error": msg}), 401

    try:
        fb_data = fb_resp.json()
    except ValueError:
        return jsonify({"error": "Invalid response from authentication provider"}), 502

    id_token = fb_data["idToken"]
    firebase_uid = fb_data["localId"]

    # 2) Look up user in our credentials table
    conn = None
    try:
        conn = get_auth_conn()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, role, is_active FROM credentials WHERE firebase_uid = %s",
                (firebase_uid,),
            )
            row = cur.fetchone()

            if not row:
                return jsonify({"error": "User not registered in system"}), 403

            user_id, role, is_active = row

            if not is_active:
                return jsonify({"error": "Account not yet approved by admin"}), 403

            return jsonify({
                "token": id_token,
                "refresh_token": fb_data.get("refreshToken"),
                "user_id": user_id,
                "role": role,
            })

    except Exception:
        return jsonify({"error": "Authentication database unavailable"}), 503
    finally:
        put_auth_conn(conn)


# =====================================
# REFRESH TOKEN
# =====================================
FIREBASE_REFRESH_URL = "https://securetoken.googleapis.com/v1/token"

@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    data = request.get_json() or {}
    refresh = data.get("refresh_token")
    if not refresh:
        return jsonify({"error": "refresh_token is required"}), 400

    api_key = Config.FIREBASE_API_KEY
    if not api_key:
        return jsonify({"error": "Server misconfiguration"}), 500

    fb_resp = http_requests.post(
        FIREBASE_REFRESH_URL,
        params={"key": api_key},
        json={"grant_type": "refresh_token", "refresh_token": refresh},
        timeout=10,
    )
    if fb_resp.status_code != 200:
        return jsonify({"error": "Token refresh failed"}), 401

    fb_data = fb_resp.json()
    return jsonify({
        "token": fb_data.get("id_token"),
        "refresh_token": fb_data.get("refresh_token"),
    })


# =====================================
# INFO ROUTES (GET — browser-friendly)
# =====================================
@auth_bp.route("/login", methods=["GET"])
def login_info():
    return jsonify({
        "endpoint": "/auth/login",
        "method": "POST",
        "body": {"identifier": "email", "password": "your_password"},
        "note": "Use POST from frontend or Postman, not the browser address bar."
    })


@auth_bp.route("/register", methods=["GET"])
def register_info():
    return jsonify({
        "endpoint": "/auth/register",
        "method": "POST",
        "body": {"email": "you@example.com", "password": "your_password", "role": "DOCTOR"},
        "note": "Use POST from frontend or Postman, not the browser address bar."
    })


# =====================================
# REGISTER USER  (email + password + role)
# =====================================
@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json() or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")
    role = (data.get("role") or "").upper()
    firebase_uid = data.get("firebase_uid")  # optional — if already created on client

    if not email or not role:
        return jsonify({"error": "Missing required fields (email, role)"}), 400

    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    # ── If no firebase_uid provided, create the Firebase user via REST API ──
    if not firebase_uid:
        if not password:
            return jsonify({"error": "Password is required for new registration"}), 400

        api_key = Config.FIREBASE_API_KEY
        if not api_key:
            return jsonify({"error": "Server misconfiguration: FIREBASE_API_KEY not set"}), 500

        fb_resp = http_requests.post(
            FIREBASE_SIGN_UP_URL,
            params={"key": api_key},
            json={
                "email": email,
                "password": password,
                "returnSecureToken": True,
            },
            timeout=10,
        )

        if fb_resp.status_code != 200:
            fb_error = fb_resp.json().get("error", {})
            msg = fb_error.get("message", "Firebase registration failed")
            return jsonify({"error": msg}), 400

        fb_data = fb_resp.json()
        firebase_uid = fb_data["localId"]

    # ── Generate user_id from hospital DB sequence (avoids collisions) ──
    h_conn = get_hospital_conn()
    try:
        with h_conn.cursor() as cur:
            cur.execute("SELECT 'NEX' || LPAD(nextval('user_seq')::TEXT, 6, '0')")
            user_id = cur.fetchone()[0]
    finally:
        put_hospital_conn(h_conn)

    # ── Store in credentials table ──
    conn = get_auth_conn()
    try:
        with conn.cursor() as cur:

            # Check if already registered
            cur.execute(
                "SELECT 1 FROM credentials WHERE firebase_uid = %s",
                (firebase_uid,)
            )
            if cur.fetchone():
                return jsonify({"error": "User already registered"}), 400

            username = email.split("@")[0]

            cur.execute("""
                INSERT INTO credentials
                (user_id, username, email, password_hash,
                 firebase_uid, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                username,
                email,
                None,               # Firebase handles password
                firebase_uid,
                role,
                False               # Needs admin approval
            ))

            conn.commit()

    except Exception as e:
        conn.rollback()
        put_auth_conn(conn)
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)

    # ── Create hospital DB records (users + role table) ──
    name = data.get("name", "").strip()
    contact_no1 = data.get("contact_no1", "").strip()
    contact_no2 = data.get("contact_no2", "").strip() or None
    address = data.get("address", "").strip()

    if not name or not contact_no1 or not address:
        return jsonify({
            "message": "Credential created, but profile incomplete. Please provide name, contact_no1, address.",
            "user_id": user_id,
            "firebase_uid": firebase_uid,
            "profile_complete": False,
        }), 201

    h_conn = get_hospital_conn()
    try:
        with h_conn.cursor() as cur:
            # Insert into users table (user_id is explicit, trigger preserves it)
            cur.execute("""
                INSERT INTO users (user_id, name, contact_no1, contact_no2, address)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, name, contact_no1, contact_no2, address))

            # Insert into role-specific table
            if role == "DOCTOR":
                license_no = data.get("license_no", "").strip()
                nic_no = data.get("nic_no", "").strip()
                gender = data.get("gender", "").strip()
                specialization = data.get("specialization", "").strip()
                certification_url = data.get("certification_url", "").strip()
                image_url = data.get("image_url", "").strip() or None

                if not all([license_no, nic_no, gender, specialization, certification_url]):
                    h_conn.rollback()
                    return jsonify({"error": "Doctor registration requires: license_no, nic_no, gender, specialization, certification_url"}), 400

                cur.execute("""
                    INSERT INTO doctor (user_id, license_no, nic_no, gender, specialization, certification_url, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (user_id, license_no, nic_no, gender, specialization, certification_url, image_url))

            elif role == "PHARMACY":
                pharmacy_license_no = data.get("pharmacy_license_no", "").strip()
                br_number = data.get("business_registration_number", "").strip()
                br_url = data.get("business_registration_url", "").strip()
                available_date = data.get("available_date")
                available_time = data.get("available_time")

                if not all([pharmacy_license_no, br_number, br_url, available_date, available_time]):
                    h_conn.rollback()
                    return jsonify({"error": "Pharmacy registration requires: pharmacy_license_no, business_registration_number, business_registration_url, available_date, available_time"}), 400

                cur.execute("""
                    INSERT INTO pharmacy (user_id, pharmacy_license_no, business_registration_number, business_registration_url, available_date, available_time)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, pharmacy_license_no, br_number, br_url, available_date, available_time))

            elif role == "LAB":
                license_no = data.get("license_no", "").strip()
                br_number = data.get("business_registration_number", "").strip()
                br_url = data.get("business_registration_url", "").strip()
                available_date = data.get("available_date")
                available_time = data.get("available_time")
                available_tests = data.get("available_tests", "").strip()

                if not all([license_no, br_number, br_url, available_date, available_time, available_tests]):
                    h_conn.rollback()
                    return jsonify({"error": "Lab registration requires: license_no, business_registration_number, business_registration_url, available_date, available_time, available_tests"}), 400

                cur.execute("""
                    INSERT INTO lab (user_id, license_no, business_registration_number, business_registration_url, available_date, available_time, available_tests)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (user_id, license_no, br_number, br_url, available_date, available_time, available_tests))

            elif role == "PATIENT":
                dob = data.get("date_of_birth")
                gender = data.get("gender", "").strip()
                blood_type = data.get("blood_type", "").strip() or None

                if dob and gender:
                    cur.execute("""
                        INSERT INTO patient (user_id, date_of_birth, gender, blood_type)
                        VALUES (%s, %s, %s, %s)
                    """, (user_id, dob, gender, blood_type))

            h_conn.commit()

        return jsonify({
            "message": "User registered successfully. Waiting for admin approval.",
            "user_id": user_id,
            "firebase_uid": firebase_uid,
        }), 201

    except Exception as e:
        h_conn.rollback()
        return jsonify({"error": f"Profile creation failed: {str(e)}"}), 500
    finally:
        put_hospital_conn(h_conn)


# =====================================
# GET CURRENT USER (IMPORTANT FOR REDIRECT)
# =====================================
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    return jsonify({
        "user_id": g.user_id,
        "role": g.role
    })


# =====================================
# GENERAL PROTECTED ROUTE
# =====================================
@auth_bp.route("/protected", methods=["GET"])
@token_required
def protected_route():
    return jsonify({"message": "You accessed a protected route!"})


# =====================================
# ADMIN ONLY ROUTE
# =====================================
@admin_bp.route("/dashboard", methods=["GET"])
@token_required
@role_required("ADMIN")
def admin_dashboard():
    return jsonify({"message": "Welcome Admin!"})