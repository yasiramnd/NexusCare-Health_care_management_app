from flask import Blueprint, request, jsonify, g
from firebase_admin import auth as firebase_auth
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn
from app.db.auth_db import get_auth_conn, put_auth_conn

patient_profile_bp = Blueprint("patient_profile_bp", __name__)


# ── GET  /patient/profile/<patient_id>  ──────────────────────────────────────
@patient_profile_bp.route("/patient/profile/<patient_id>", methods=["GET"])
@token_required
def get_patient_profile(patient_id):
    """
    Return full profile for a patient:
      users  → name, contact_no1, contact_no2, address
      patient → nic, date_of_birth, gender
      credentials → email
    """
    h_conn = get_hospital_conn()
    a_conn = get_auth_conn()
    try:
        profile = {}

        # ── Hospital DB: users + patient ────────────────────────────────
        with h_conn.cursor() as cur:
            cur.execute("""
                SELECT u.user_id, u.name, u.contact_no1, u.contact_no2, u.address,
                       p.patient_id, p.nic, p.date_of_birth, p.gender
                FROM users u
                JOIN patient p ON p.user_id = u.user_id
                WHERE p.patient_id = %s
            """, (patient_id,))
            row = cur.fetchone()

            if not row:
                return jsonify({"error": "Patient not found"}), 404

            profile = {
                "user_id":      row["user_id"],
                "name":         row["name"],
                "contact_no1":  row["contact_no1"],
                "contact_no2":  row["contact_no2"],
                "address":      row["address"],
                "patient_id":   row["patient_id"],
                "nic":          row["nic"],
                "date_of_birth": str(row["date_of_birth"]) if row["date_of_birth"] else None,
                "gender":       row["gender"],
            }

        # ── Auth DB: email ──────────────────────────────────────────────
        with a_conn.cursor() as cur:
            cur.execute(
                "SELECT email FROM credentials WHERE user_id = %s",
                (profile["user_id"],)
            )
            cred = cur.fetchone()
            profile["email"] = cred[0] if cred else None

        return jsonify(profile), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(h_conn)
        put_auth_conn(a_conn)


# ── PUT  /patient/profile/<patient_id>  ──────────────────────────────────────
@patient_profile_bp.route("/patient/profile/<patient_id>", methods=["PUT"])
@token_required
def update_patient_profile(patient_id):
    """
    Update editable profile fields.
    Accepts JSON: { name, contact_no1, contact_no2, address }
    """
    data = request.get_json()
    name        = data.get("name")
    contact_no1 = data.get("contact_no1")
    contact_no2 = data.get("contact_no2")
    address     = data.get("address")

    h_conn = get_hospital_conn()
    try:
        with h_conn.cursor() as cur:
            # Look up the user_id from patient table
            cur.execute(
                "SELECT user_id FROM patient WHERE patient_id = %s",
                (patient_id,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Patient not found"}), 404

            user_id = row["user_id"]

            # Build dynamic UPDATE
            updates = []
            values  = []
            if name is not None:
                updates.append("name = %s")
                values.append(name)
            if contact_no1 is not None:
                updates.append("contact_no1 = %s")
                values.append(contact_no1)
            if contact_no2 is not None:
                updates.append("contact_no2 = %s")
                values.append(contact_no2)
            if address is not None:
                updates.append("address = %s")
                values.append(address)

            if not updates:
                return jsonify({"error": "No fields to update"}), 400

            values.append(user_id)
            cur.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s",
                tuple(values)
            )

        h_conn.commit()

        # If name was updated, also update Firebase display name
        if name:
            try:
                a_conn = get_auth_conn()
                with a_conn.cursor() as cur:
                    cur.execute(
                        "SELECT firebase_uid FROM credentials WHERE user_id = %s",
                        (user_id,)
                    )
                    cred = cur.fetchone()
                    if cred and cred[0]:
                        firebase_auth.update_user(
                            cred[0],
                            display_name=name
                        )
                put_auth_conn(a_conn)
            except Exception:
                pass  # non-critical — DB is already updated

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        h_conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(h_conn)


# ── POST  /patient/change-password  ─────────────────────────────────────────
@patient_profile_bp.route("/patient/change-password", methods=["POST"])
@token_required
def change_password():
    """
    Change the user's Firebase password.
    Body: { new_password }
    The caller is already authenticated via @token_required,
    so we trust their identity from g.user_id.
    """
    data = request.get_json()
    new_password = data.get("new_password")

    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    a_conn = get_auth_conn()
    try:
        with a_conn.cursor() as cur:
            cur.execute(
                "SELECT firebase_uid FROM credentials WHERE user_id = %s",
                (g.user_id,)
            )
            cred = cur.fetchone()

            if not cred or not cred[0]:
                return jsonify({"error": "User credentials not found"}), 404

            firebase_auth.update_user(
                cred[0],
                password=new_password
            )

        return jsonify({"message": "Password changed successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(a_conn)