from flask import Blueprint, request, jsonify
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn

admin_dashboard_bp = Blueprint("admin_dashboard_bp", __name__)


# =====================================
# DASHBOARD STATS
# =====================================
@admin_dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard():
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM patient")
            patients = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM doctor")
            doctors = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM pharmacy")
            pharmacies = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM lab")
            labs = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM appointment")
            appointments = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM doctor WHERE verification_status='Pending'")
            pending_doctors = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM pharmacy WHERE verification_status='Pending'")
            pending_pharmacies = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM lab WHERE verification_status='Pending'")
            pending_labs = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM doctor WHERE verification_status='Approved'")
            available_doctors = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM pharmacy WHERE verification_status='Approved'")
            available_pharmacies = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM lab WHERE verification_status='Approved'")
            available_labs = cur.fetchone()[0]

            return jsonify({
                "totalPatients": patients,
                "pendingRequests": pending_doctors + pending_pharmacies + pending_labs,
                "totalDoctors": available_doctors,
                "totalPharmacies": available_pharmacies,
                "totalLabs": available_labs,
                "totalAppointments": appointments,
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# PENDING DOCTORS
# =====================================
@admin_dashboard_bp.route("/doctors", methods=["GET"])
def doctors():
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    d.doctor_id,
                    u.name,
                    d.specialization,
                    d.license_no,
                    d.verification_status,
                    d.gender,
                    d.nic_no,
                    u.contact_no1,
                    u.contact_no2,
                    u.address,
                    d.image_url,
                    d.certification_url
                FROM doctor d
                JOIN users u ON d.user_id = u.user_id
                WHERE d.verification_status = 'Pending'
            """)
            rows = cur.fetchall()
            result = []
            for r in rows:
                result.append({
                    "id": r[0], "name": r[1], "type": r[2], "license": r[3],
                    "status": r[4], "gender": r[5], "nic_no": r[6],
                    "contact_no1": r[7], "contact_no2": r[8], "address": r[9],
                    "imageURL": r[10], "certificationURL": r[11],
                })
            return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# PENDING LABS
# =====================================
@admin_dashboard_bp.route("/labs", methods=["GET"])
def labs():
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    l.lab_id,
                    u.name,
                    u.address,
                    u.contact_no1,
                    u.contact_no2,
                    l.license_no,
                    l.business_registration_number,
                    l.business_registration_url,
                    l.available_tests,
                    l.verification_status
                FROM lab l
                JOIN users u ON l.user_id = u.user_id
                WHERE l.verification_status = 'Pending'
            """)
            rows = cur.fetchall()
            result = []
            for r in rows:
                result.append({
                    "id": r[0], "name": r[1], "address": r[2],
                    "contact_no1": r[3], "contact_no2": r[4],
                    "license": r[5], "br_no": r[6], "br_url": r[7],
                    "available_tests": r[8], "status": r[9],
                })
            return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# PENDING PHARMACIES
# =====================================
@admin_dashboard_bp.route("/pharmacies", methods=["GET"])
def pharmacies():
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.pharmacy_id,
                    u.name,
                    u.address,
                    u.contact_no1,
                    u.contact_no2,
                    p.pharmacy_license_no,
                    p.business_registration_number,
                    p.business_registration_url,
                    p.verification_status
                FROM pharmacy p
                JOIN users u ON p.user_id = u.user_id
                WHERE p.verification_status = 'Pending'
            """)
            rows = cur.fetchall()
            result = []
            for r in rows:
                result.append({
                    "id": r[0], "name": r[1], "address": r[2],
                    "contact_no1": r[3], "contact_no2": r[4],
                    "license": r[5], "br_no": r[6], "br_url": r[7],
                    "status": r[8],
                })
            return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# ALL USERS BY ROLE
# =====================================
@admin_dashboard_bp.route("/users/<role>", methods=["GET"])
def get_users(role):
    role_map = {
        "patient": """
            SELECT p.patient_id, u.name, u.user_id
            FROM patient p JOIN users u ON p.user_id = u.user_id
        """,
        "doctor": """
            SELECT d.doctor_id, u.name, u.user_id, d.verification_status
            FROM doctor d JOIN users u ON d.user_id = u.user_id
        """,
        "pharmacy": """
            SELECT p.pharmacy_id, u.name, u.user_id, p.verification_status
            FROM pharmacy p JOIN users u ON p.user_id = u.user_id
        """,
        "lab": """
            SELECT l.lab_id, u.name, u.user_id, l.verification_status
            FROM lab l JOIN users u ON l.user_id = u.user_id
        """,
    }

    if role not in role_map:
        return jsonify({"error": "Invalid role"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(role_map[role])
            rows = cur.fetchall()

            users = []
            for r in rows:
                user = {"subId": r[0], "name": r[1], "userId": r[2]}
                if role != "patient":
                    user["status"] = r[3] if len(r) > 3 else "Active"
                else:
                    user["status"] = "Active"  # will be updated from auth DB below
                users.append(user)

        # For patients, check login status from auth DB
        if role == "patient":
            auth_conn = get_auth_conn()
            try:
                with auth_conn.cursor() as auth_cur:
                    for user in users:
                        auth_cur.execute(
                            "SELECT is_active FROM credentials WHERE user_id = %s",
                            (user["userId"],),
                        )
                        result = auth_cur.fetchone()
                        if result and result[0]:
                            user["status"] = "Active"
                        else:
                            user["status"] = "Disabled"
            finally:
                put_auth_conn(auth_conn)

        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# UPDATE VERIFICATION STATUS
# =====================================
@admin_dashboard_bp.route("/update/<role>/<entity_id>/<status>", methods=["POST"])
def update_status(role, entity_id, status):
    if status not in ("Approved", "Rejected"):
        return jsonify({"error": "Invalid status"}), 400

    table_map = {
        "doctor": ("doctor", "doctor_id"),
        "lab": ("lab", "lab_id"),
        "pharmacy": ("pharmacy", "pharmacy_id"),
    }

    if role not in table_map:
        return jsonify({"error": "Invalid role"}), 400

    table, id_col = table_map[role]

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Update verification_status in hospital DB
            cur.execute(
                f"UPDATE {table} SET verification_status = %s WHERE {id_col} = %s",
                (status, entity_id),
            )

            # Get user_id so we can update auth DB
            cur.execute(
                f"SELECT user_id FROM {table} WHERE {id_col} = %s",
                (entity_id,),
            )
            row = cur.fetchone()
            conn.commit()

        # Update is_active in auth DB (Approved → active, Rejected → inactive)
        if row and row[0]:
            user_id = row[0]
            auth_conn = get_auth_conn()
            try:
                with auth_conn.cursor() as auth_cur:
                    auth_cur.execute(
                        "UPDATE credentials SET is_active = %s WHERE user_id = %s",
                        (status == "Approved", user_id),
                    )
                    auth_conn.commit()
            except Exception:
                auth_conn.rollback()
            finally:
                put_auth_conn(auth_conn)

        return jsonify({"message": "Updated successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# USER FULL DETAILS
# =====================================
@admin_dashboard_bp.route("/user-details/<role>/<user_id>", methods=["GET"])
def user_details(role, user_id):
    query_map = {
        "patient": """
            SELECT u.name, u.user_id, p.patient_id, u.address, u.contact_no1,
                   u.contact_no2, p.date_of_birth, p.gender, p.qr_code, u.created_at
            FROM users u JOIN patient p ON u.user_id = p.user_id
            WHERE u.user_id = %s
        """,
        "doctor": """
            SELECT u.name, u.user_id, d.doctor_id, d.license_no, d.nic_no,
                   d.gender, d.specialization, d.image_url, d.certification_url,
                   d.verification_status, u.contact_no1, u.contact_no2, u.address, u.created_at
            FROM users u JOIN doctor d ON u.user_id = d.user_id
            WHERE u.user_id = %s
        """,
        "pharmacy": """
            SELECT u.name, u.user_id, p.pharmacy_id, p.pharmacy_license_no,
                   p.business_registration_number, p.business_registration_url,
                   p.available_date, p.verification_status,
                   u.contact_no1, u.contact_no2, u.address, u.created_at
            FROM users u JOIN pharmacy p ON u.user_id = p.user_id
            WHERE u.user_id = %s
        """,
        "lab": """
            SELECT u.name, u.user_id, l.lab_id, l.license_no,
                   l.business_registration_number, l.business_registration_url,
                   l.available_tests, l.verification_status,
                   u.contact_no1, u.contact_no2, u.address, u.created_at
            FROM users u JOIN lab l ON u.user_id = l.user_id
            WHERE u.user_id = %s
        """,
    }

    if role not in query_map:
        return jsonify({"error": "Invalid role"}), 400

    col_map = {
        "patient": [
            "name", "user_id", "patient_id", "address", "contact_no1",
            "contact_no2", "date_of_birth", "gender", "qr_code", "created_at",
        ],
        "doctor": [
            "name", "user_id", "doctor_id", "license_no", "nic_no",
            "gender", "specialization", "image_url", "certification_url",
            "verification_status", "contact_no1", "contact_no2", "address", "created_at",
        ],
        "pharmacy": [
            "name", "user_id", "pharmacy_id", "pharmacy_license_no",
            "business_registration_number", "business_registration_url",
            "available_date", "verification_status",
            "contact_no1", "contact_no2", "address", "created_at",
        ],
        "lab": [
            "name", "user_id", "lab_id", "license_no",
            "business_registration_number", "business_registration_url",
            "available_tests", "verification_status",
            "contact_no1", "contact_no2", "address", "created_at",
        ],
    }

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(query_map[role], (user_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "User not found"}), 404
            result = {}
            for i, col in enumerate(col_map[role]):
                val = row[i]
                if val is not None:
                    result[col] = str(val)
            return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# =====================================
# DISABLE USER LOGIN (AUTH DATABASE)
# =====================================
@admin_dashboard_bp.route("/delete-login/<user_id>", methods=["DELETE"])
def delete_user_login(user_id):
    conn = get_auth_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE credentials SET is_active = FALSE WHERE user_id = %s",
                (user_id,),
            )
            conn.commit()
        return jsonify({"message": "User login disabled", "user_id": user_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_auth_conn(conn)
