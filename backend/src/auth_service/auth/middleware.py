from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
from src.auth_service.firebase.firebase_init import init_firebase


# 🔐 TOKEN VERIFICATION MIDDLEWARE
def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        token = auth_header.split(" ")[1]

        try:
            init_firebase(required=True)
            # Verify Firebase token
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token["uid"]

        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Check user in database
        conn = get_auth_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, role, is_active
                    FROM credentials
                    WHERE firebase_uid = %s
                """, (firebase_uid,))
                user = cur.fetchone()

                if not user:
                    return jsonify({"error": "User not registered"}), 403

                user_id, role, is_active = user

                if not is_active:
                    return jsonify({"error": "User not approved yet"}), 403

                # Store user info globally
                g.user_id = user_id
                g.role = role

        finally:
            put_auth_conn(conn)

        return f(*args, **kwargs)

    return wrapper


# 🔐 ROLE-BASED AUTHORIZATION MIDDLEWARE
def role_required(allowed_roles):
    """
    allowed_roles should be a list like:
    ["ADMIN"] or ["ADMIN", "DOCTOR"]
    """

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):

            if g.role not in allowed_roles:
                return jsonify({"error": "Access denied"}), 403

            return f(*args, **kwargs)

        return wrapper
    return decorator