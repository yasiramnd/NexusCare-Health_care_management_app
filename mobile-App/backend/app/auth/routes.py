from flask import Blueprint, request, jsonify, g
from app.db.auth_db import get_auth_conn, put_auth_conn
from app.db.hospital_db import get_hospital_conn, put_hospital_conn
from app.auth.middleware import token_required, role_required

auth_bp  = Blueprint("auth_bp",  __name__)
admin_bp = Blueprint("admin_bp", __name__)

# Root route for blueprint (optional, only if blueprint is registered at '/')
@auth_bp.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Auth API root. Backend is running!"})

VALID_ROLES = {"ADMIN", "DOCTOR", "PATIENT", "LAB", "PHARMACY"}


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
                cur.execute("""
                    SELECT u.name, p.patient_id
                    FROM users u
                    LEFT JOIN patient p ON p.user_id = u.user_id
                    WHERE u.user_id = %s
                """, (g.user_id,))
                user_data = cur.fetchone()
                if user_data:
                    res["name"] = user_data[0]        # Fixed: use index 0 for name
                    res["patient_id"] = user_data[1]  # Fixed: use index 1 for patient_id
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
                    res["name"] = user_data[0]  # Fixed: use index 0 for name
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