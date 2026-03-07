from flask import Blueprint, request, jsonify, g
import requests as http_requests
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
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

    if fb_resp.status_code != 200:
        fb_error = fb_resp.json().get("error", {})
        msg = fb_error.get("message", "Authentication failed")
        return jsonify({"error": msg}), 401

    fb_data = fb_resp.json()
    id_token = fb_data["idToken"]
    firebase_uid = fb_data["localId"]

    # 2) Look up user in our credentials table
    conn = get_auth_conn()
    try:
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
                "user_id": user_id,
                "role": role,
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)


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

            # Generate next user_id
            cur.execute("SELECT COALESCE(MAX(user_id), 'NEX000000') FROM credentials")
            last_id = cur.fetchone()[0]
            last_number = int(last_id.replace("NEX", ""))
            new_number = last_number + 1
            user_id = f"NEX{new_number:06d}"

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

        return jsonify({
            "message": "User registered successfully. Waiting for admin approval.",
            "user_id": user_id,
            "firebase_uid": firebase_uid,
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        put_auth_conn(conn)


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