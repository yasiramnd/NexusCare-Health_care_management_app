from flask import Blueprint, request, jsonify, g
from app.db.auth_db import get_auth_conn, put_auth_conn
from app.db.hospital_db import get_hospital_conn, put_hospital_conn
from app.auth.middleware import token_required, role_required
import re
from firebase_admin import auth as firebase_auth

auth_bp  = Blueprint("auth_bp",  __name__)
admin_bp = Blueprint("admin_bp", __name__)

# Root route for blueprint (optional, only if blueprint is registered at '/')
@auth_bp.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Auth API root. Backend is running!"})

VALID_ROLES = {"ADMIN", "DOCTOR", "PATIENT", "LAB", "PHARMACY"}

def is_strong_password(password):
    """
    Checks if password is strong:
    - Min 8 chars
    - 1 uppercase, 1 lowercase, 1 digit, 1 special char
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    return True, None


# ── Register ──────────────────────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register_user():
    """
    Body: { firebase_uid, email, role }
    Inserts into credentials table in AUTH_DB.
    Account starts inactive — admin must approve.
    """
    data = request.get_json()

    firebase_uid = data.get("firebase_uid")
    email        = data.get("email")
    role         = data.get("role")

    if not firebase_uid or not email or not role:
        return jsonify({"error": "Missing required fields: firebase_uid, email, role"}), 400

    role = role.upper()
    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    conn = get_auth_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM credentials WHERE firebase_uid = %s",
                (firebase_uid,)
            )
            if cur.fetchone():
                return jsonify({"error": "User already registered"}), 409

            cur.execute("SELECT COALESCE(MAX(user_id), 'NEX000000') FROM credentials")
            last_id     = cur.fetchone()[0]
            last_number = int(last_id.replace("NEX", ""))
            user_id     = f"NEX{last_number + 1:06d}"
            username    = email.split("@")[0]

            cur.execute("""
                INSERT INTO credentials
                    (user_id, username, email, password_hash, firebase_uid, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, username, email, None, firebase_uid, role, False))

            conn.commit()

        return jsonify({
            "message": "Registration successful. Waiting for admin approval.",
            "user_id": user_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)


# ── Reset Password ────────────────────────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Body: { email, new_password }
    Updates Firebase user password directly.
    """
    data = request.get_json()
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        return jsonify({"error": "Missing email or new_password"}), 400

    # 1. Validate password strength
    is_strong, msg = is_strong_password(new_password)
    if not is_strong:
        return jsonify({"error": msg}), 400

    try:
        # 2. Find Firebase user by email
        user = firebase_auth.get_user_by_email(email)
        
        # 3. Update password
        firebase_auth.update_user(user.uid, password=new_password)
        
        return jsonify({"message": "Password reset successfully"}), 200

    except firebase_auth.UserNotFoundError:
        return jsonify({"error": "No account found with this email"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Current user ──────────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """Returns the logged-in user's info including name and patient_id."""
    res = {
        "user_id": g.user_id,
        "role":    g.role,
        "name":    None,
        "patient_id": None
    }

    # Fetch name and patient_id if they are a PATIENT
    if g.role == "PATIENT":
        h_conn = get_hospital_conn()
        try:
            with h_conn.cursor() as cur:
                # hospital_db uses RealDictCursor → results are dicts
                cur.execute("""
                    SELECT u.name, p.patient_id
                    FROM users u
                    LEFT JOIN patient p ON p.user_id = u.user_id
                    WHERE u.user_id = %s
                """, (g.user_id,))
                user_data = cur.fetchone()
                if user_data:
                    res["name"]       = user_data["name"]
                    res["patient_id"] = user_data["patient_id"]
        except Exception as e:
            print(f"Error fetching patient info: {e}")
        finally:
            put_hospital_conn(h_conn)

    # Fetch name if they are a DOCTOR (or other roles)
    elif g.role in ["DOCTOR", "LAB", "PHARMACY", "ADMIN"]:
        h_conn = get_hospital_conn()
        try:
            with h_conn.cursor() as cur:
                cur.execute("SELECT name FROM users WHERE user_id = %s", (g.user_id,))
                user_data = cur.fetchone()
                if user_data:
                    res["name"] = user_data["name"]
        except Exception as e:
            print(f"Error fetching user name: {e}")
        finally:
            put_hospital_conn(h_conn)

    return jsonify(res)


# ── Protected test route ──────────────────────────────────────────────────────
@auth_bp.route("/protected", methods=["GET"])
@token_required
def protected_route():
    return jsonify({"message": "You accessed a protected route!", "user_id": g.user_id})


# ── Admin: dashboard ──────────────────────────────────────────────────────────
@admin_bp.route("/dashboard", methods=["GET"])
@token_required
@role_required("ADMIN")
def admin_dashboard():
    return jsonify({"message": "Welcome Admin!", "user_id": g.user_id})


# ── Admin: list pending users ─────────────────────────────────────────────────
@admin_bp.route("/pending-users", methods=["GET"])
@token_required
@role_required("ADMIN")
def list_pending_users():
    conn = get_auth_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT user_id, username, email, role, is_active
                FROM credentials
                WHERE is_active = FALSE
                ORDER BY user_id
            """)
            rows = cur.fetchall()
            # Convert tuples to dicts manually
            users = []
            for row in rows:
                users.append({
                    "user_id": row[0],
                    "username": row[1],
                    "email": row[2],
                    "role": row[3],
                    "is_active": row[4]
                })
        return jsonify({"pending_users": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)


# ── Admin: approve user ───────────────────────────────────────────────────────
@admin_bp.route("/approve/<user_id>", methods=["PATCH"])
@token_required
@role_required("ADMIN")
def approve_user(user_id):
    conn = get_auth_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE credentials SET is_active = TRUE WHERE user_id = %s RETURNING user_id",
                (user_id,)
            )
            if not cur.fetchone():
                return jsonify({"error": "User not found"}), 404
            conn.commit()
        return jsonify({"message": f"User {user_id} approved successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)