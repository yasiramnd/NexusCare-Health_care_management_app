from functools import wraps
from flask import request, jsonify, g
from firebase_admin import auth
from app.db.auth_db import get_auth_conn, put_auth_conn


def token_required(f):
    """
    Verify Firebase ID token sent in Authorization header.
    Sets g.user_id and g.role on success.
    Checks the credentials table in AUTH_DB (Supabase ap-south-1).
    """
    @wraps(f)
    def wrapper(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        token = auth_header.split(" ")[1]

        try:
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token["uid"]
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

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

                # FIXED: Use tuple indices instead of dictionary keys
                user_id = user[0]    # was user["user_id"]
                role = user[1]       # was user["role"]
                is_active = user[2]  # was user["is_active"]

                if not is_active:
                    return jsonify({"error": "Account pending admin approval"}), 403

                g.user_id = user_id
                g.role = role
        finally:
            put_auth_conn(conn)

        return f(*args, **kwargs)

    return wrapper


def role_required(*allowed_roles):
    """
    Usage: @role_required("ADMIN") or @role_required("ADMIN", "DOCTOR")
    Must be placed AFTER @token_required.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if g.role not in allowed_roles:
                return jsonify({"error": "Access denied: insufficient permissions"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator