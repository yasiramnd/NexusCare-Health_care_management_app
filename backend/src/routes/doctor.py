from flask import Blueprint, request, jsonify, g, current_app
from src.auth_service.auth.middleware import token_required, role_required
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
from src.utils.supabase_storage import (
    SupabaseStorageError,
    upload_bytes,
    extract_object_path_from_url,
    object_exists,
)
from werkzeug.utils import secure_filename
from datetime import date
import uuid, os

doctor_portal_bp = Blueprint("doctor_portal_bp", __name__)


def _lab_report_file_exists(file_url: str) -> bool:
    url = (file_url or "").strip()
    if not url:
        return False

    if url.startswith("/uploads/"):
        rel_path = url.replace("/uploads/", "", 1)
        abs_path = os.path.join(current_app.config.get("UPLOAD_FOLDER", "uploads"), rel_path)
        return os.path.exists(abs_path)

    # Keep non-Supabase URLs visible for backward compatibility.
    if "/storage/v1/object/" not in url:
        return True

    object_path = extract_object_path_from_url("lab-report", url)
    if not object_path:
        return False

    try:
        return object_exists("lab-report", object_path)
    except SupabaseStorageError:
        return False


@doctor_portal_bp.post("/doctor/consultation-documents/upload")
@token_required
@role_required("DOCTOR")
def upload_consultation_document():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "No file uploaded"}), 400

    safe_name = secure_filename(file.filename)
    if not safe_name:
        return jsonify({"error": "Invalid file name"}), 400

    max_mb = int(current_app.config.get("MAX_REPORT_UPLOAD_MB", 20))
    size_mb = (request.content_length or 0) / (1024 * 1024)
    if size_mb > max_mb:
        return jsonify({"error": f"File is too large. Max {max_mb}MB"}), 400

    object_path = f"doctor-consultation/{doctor_id}/{uuid.uuid4().hex}_{safe_name}"
    try:
        content_type = file.mimetype or "application/octet-stream"
        file_url = upload_bytes("medical-docs", object_path, file.read(), content_type)
    except SupabaseStorageError as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"url": file_url, "filename": safe_name, "storage_provider": "supabase"}), 201


# ─────────────────────────────────────────────
# POST /api/doctor/register-request
# Called during registration (no auth token yet)
# ─────────────────────────────────────────────
@doctor_portal_bp.post("/doctor/register-request")
def doctor_register_request():
    user_id = request.form.get("user_id")
    name = request.form.get("name")
    contact_no1 = request.form.get("contact_no1")
    contact_no2 = request.form.get("contact_no2", "")
    address = request.form.get("address")
    license_no = request.form.get("license_no")
    nic_no = request.form.get("nic_no")
    gender = request.form.get("gender")
    specialization = request.form.get("specialization")

    if not all([user_id, name, contact_no1, address, license_no, nic_no, gender, specialization]):
        return jsonify({"error": "Missing required fields"}), 400

    # Verify user_id exists in auth credentials
    auth_conn = get_auth_conn()
    try:
        with auth_conn.cursor() as cur:
            cur.execute("SELECT role FROM credentials WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row or row[0] != "DOCTOR":
                return jsonify({"error": "Invalid user_id or not a doctor account"}), 400
    finally:
        put_auth_conn(auth_conn)

    # Handle certificate file upload
    certification_url = ""
    cert_file = request.files.get("certificate")
    if cert_file and cert_file.filename:
        filename = secure_filename(cert_file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        file_path = os.path.join(upload_folder, unique_filename)
        cert_file.save(file_path)
        certification_url = f"/uploads/{unique_filename}"

    # Handle optional image file
    image_url = None
    img_file = request.files.get("image")
    if img_file and img_file.filename:
        filename = secure_filename(img_file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        file_path = os.path.join(upload_folder, unique_filename)
        img_file.save(file_path)
        image_url = f"/uploads/{unique_filename}"

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Check if user already exists in hospital DB
            cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO users (user_id, name, contact_no1, contact_no2, address)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, name, contact_no1, contact_no2, address))

            # Check if doctor record already exists
            cur.execute("SELECT doctor_id FROM doctor WHERE user_id = %s", (user_id,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO doctor
                        (user_id, license_no, nic_no, gender, specialization,
                         certification_url, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (user_id, license_no, nic_no, gender, specialization,
                      certification_url or "pending", image_url))

            conn.commit()
        return jsonify({"message": "Doctor profile created successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


def get_doctor_id_for_user(user_id: str):
    """Resolve hospital doctor_id from auth user_id."""
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT doctor_id FROM doctor WHERE user_id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/me  — doctor profile
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/me")
@token_required
@role_required("DOCTOR")
def get_doctor_me():
    user_id = g.user_id
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    d.doctor_id,
                    u.name,
                    u.contact_no1,
                    u.contact_no2,
                    u.address,
                    d.license_no,
                    d.nic_no,
                    d.gender,
                    d.specialization,
                    d.image_url
                FROM doctor d
                JOIN users u ON d.user_id = u.user_id
                WHERE d.user_id = %s
            """, (user_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Doctor profile not found"}), 404

            # Get verification status
            conn2 = get_auth_conn()
            email = None
            is_active = False
            try:
                with conn2.cursor() as cur2:
                    cur2.execute(
                        "SELECT email, is_active FROM credentials WHERE user_id = %s",
                        (user_id,)
                    )
                    cred_row = cur2.fetchone()
                    if cred_row:
                        email = cred_row[0]
                        is_active = cred_row[1]
            finally:
                put_auth_conn(conn2)

            verification = "Approved" if is_active else "Pending"

            return jsonify({
                "doctor_id": row[0],
                "name": row[1],
                "phone": row[2],
                "phone2": row[3],
                "address": row[4],
                "license_no": row[5],
                "nic": row[6],
                "gender": row[7],
                "specialization": row[8],
                "image_url": row[9],
                "email": email,
                "verification": verification,
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/doctor/me  — update doctor profile
# ─────────────────────────────────────────────
@doctor_portal_bp.patch("/doctor/me")
@token_required
@role_required("DOCTOR")
def update_doctor_me():
    user_id = g.user_id
    data = request.get_json() or {}

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE users SET
                    name = COALESCE(%s, name),
                    contact_no1 = COALESCE(%s, contact_no1),
                    address = COALESCE(%s, address)
                WHERE user_id = %s
            """, (
                data.get("name"),
                data.get("phone"),
                data.get("address"),
                user_id
            ))
            cur.execute("""
                UPDATE doctor SET
                    specialization = COALESCE(%s, specialization),
                    image_url = COALESCE(%s, image_url)
                WHERE user_id = %s
            """, (
                data.get("specialization"),
                data.get("image_url"),
                user_id
            ))
            conn.commit()
        return jsonify({"message": "Profile updated successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/dashboard  — dashboard stats
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/dashboard")
@token_required
@role_required("DOCTOR")
def get_dashboard():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    today = date.today()
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Today's appointments with patient names
            cur.execute("""
                SELECT
                    a.appointment_id,
                    u.name AS patient_name,
                    a.patient_id,
                    a.appointment_time,
                    a.status
                FROM appointment a
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                WHERE a.doctor_id = %s AND a.appointment_date = %s
                ORDER BY a.appointment_time
            """, (doctor_id, today))
            appt_rows = cur.fetchall()

            today_appointments = [
                {
                    "appointment_id": r[0],
                    "patient_name": r[1],
                    "patient_id": r[2],
                    "time": str(r[3]),
                    "status": r[4],
                }
                for r in appt_rows
            ]

            # Counts
            total_today = len(today_appointments)
            in_progress = sum(1 for a in today_appointments if a["status"] == "Ongoing")
            upcoming = sum(1 for a in today_appointments if a["status"] == "Waiting")

            # Patients seen this week (Conducted, this week)
            cur.execute("""
                SELECT COUNT(DISTINCT patient_id)
                FROM appointment
                WHERE doctor_id = %s
                  AND status = 'Conducted'
                  AND appointment_date >= date_trunc('week', CURRENT_DATE)
            """, (doctor_id,))
            patients_seen_week = cur.fetchone()[0] or 0

            # Pending lab reports
            cur.execute("""
                SELECT COUNT(*)
                FROM lab_reports
                WHERE doctor_id = %s
                  AND uploaded_at >= CURRENT_DATE - INTERVAL '30 days'
            """, (doctor_id,))
            pending_labs = cur.fetchone()[0] or 0

            # Prescriptions this month
            cur.execute("""
                SELECT COUNT(*)
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.doctor_id = %s
                  AND pr.created_at >= date_trunc('month', CURRENT_DATE)
            """, (doctor_id,))
            prescriptions_month = cur.fetchone()[0] or 0

            # Pending lab reports (for dashboard widget) — last 3 pending labs
            cur.execute("""
                SELECT
                    lr.lab_report_id,
                    u.name AS patient_name,
                    lr.test_name,
                    lr.uploaded_at::DATE
                FROM lab_reports lr
                JOIN patient p ON lr.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                WHERE lr.doctor_id = %s
                ORDER BY lr.uploaded_at DESC
                LIMIT 3
            """, (doctor_id,))
            lab_rows = cur.fetchall()
            pending_lab_list = [
                {
                    "lab_report_id": r[0],
                    "patient_name": r[1],
                    "test_name": r[2],
                    "date": str(r[3]),
                }
                for r in lab_rows
            ]

        return jsonify({
            "stats": {
                "today_appointments": total_today,
                "in_progress": in_progress,
                "upcoming": upcoming,
                "patients_seen_week": patients_seen_week,
                "pending_labs": pending_labs,
                "prescriptions_month": prescriptions_month,
            },
            "today_appointments": today_appointments,
            "pending_labs": pending_lab_list,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/appointments  — all appointments
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/appointments")
@token_required
@role_required("DOCTOR")
def get_doctor_appointments():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    status_filter = request.args.get("status")  # optional
    date_filter = request.args.get("date")       # optional (YYYY-MM-DD)

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT
                    a.appointment_id,
                    u.name AS patient_name,
                    a.patient_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    a.is_paid
                FROM appointment a
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                WHERE a.doctor_id = %s
            """
            params = [doctor_id]

            if status_filter:
                sql += " AND a.status = %s"
                params.append(status_filter)
            if date_filter:
                sql += " AND a.appointment_date = %s"
                params.append(date_filter)

            sql += " ORDER BY a.appointment_date DESC, a.appointment_time DESC"
            cur.execute(sql, params)
            rows = cur.fetchall()

        return jsonify([
            {
                "appointment_id": r[0],
                "patient_name": r[1],
                "patient_id": r[2],
                "date": str(r[3]),
                "time": str(r[4]),
                "status": r[5],
                "is_paid": r[6],
            }
            for r in rows
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/prescriptions  — prescriptions issued
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/prescriptions")
@token_required
@role_required("DOCTOR")
def get_doctor_prescriptions():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Group prescriptions by record (each record = one prescription session)
            cur.execute("""
                SELECT
                    mr.record_id,
                    u.name AS patient_name,
                    p.patient_id,
                    mr.visit_date,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'prescription_id', pr.prescription_id,
                            'medicine_name', pr.medicine_name,
                            'dosage', pr.dosage,
                            'frequency', pr.frequency,
                            'duration_days', pr.duration_days,
                            'status', pr.status
                        )
                    ) AS medications,
                    MIN(pr.status) AS prescription_status
                FROM medical_record mr
                JOIN patient p ON mr.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                JOIN prescription pr ON pr.record_id = mr.record_id
                WHERE mr.doctor_id = %s
                GROUP BY mr.record_id, u.name, p.patient_id, mr.visit_date
                ORDER BY mr.visit_date DESC
            """, (doctor_id, doctor_id))
            rows = cur.fetchall()

            # Stats
            cur.execute("""
                SELECT COUNT(pr.prescription_id)
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.doctor_id = %s
            """, (doctor_id,))
            total = cur.fetchone()[0] or 0

            cur.execute("""
                SELECT COUNT(pr.prescription_id)
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.doctor_id = %s AND pr.status = 'Issued'
            """, (doctor_id,))
            active_count = cur.fetchone()[0] or 0

            cur.execute("""
                SELECT COUNT(pr.prescription_id)
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.doctor_id = %s
                  AND pr.created_at >= date_trunc('month', CURRENT_DATE)
            """, (doctor_id,))
            this_month = cur.fetchone()[0] or 0

        return jsonify({
            "stats": {
                "total": total,
                "active": active_count,
                "this_month": this_month,
            },
            "prescriptions": [
                {
                    "record_id": r[0],
                    "patient_name": r[1],
                    "patient_id": r[2],
                    "date": str(r[3]),
                    "medications": r[4],
                    "status": r[5],
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/lab-reports  — lab reports
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/lab-reports")
@token_required
@role_required("DOCTOR")
def get_doctor_lab_reports():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    x.report_id,
                    x.patient_name,
                    x.patient_id,
                    x.test_name,
                    x.uploaded_date,
                    x.file_url,
                    x.lab_name
                FROM (
                    SELECT
                        lr.request_id::TEXT AS report_id,
                        u.name AS patient_name,
                        p.patient_id,
                        lr.test_name,
                        COALESCE(lr.report_uploaded_at, lr.updated_at)::DATE AS uploaded_date,
                        lr.report_file_url AS file_url,
                        lu.name AS lab_name
                    FROM lab_requests lr
                    JOIN patient p ON lr.patient_id = p.patient_id
                    JOIN users u ON p.user_id = u.user_id
                    LEFT JOIN lab l ON lr.lab_id = l.lab_id
                    LEFT JOIN users lu ON l.user_id = lu.user_id
                    WHERE lr.doctor_id = %s
                      AND lr.report_file_url IS NOT NULL

                    UNION ALL

                    SELECT
                        lrp.lab_report_id::TEXT AS report_id,
                        u.name AS patient_name,
                        p.patient_id,
                        lrp.test_name,
                        lrp.uploaded_at::DATE AS uploaded_date,
                        lrp.file_url,
                        lu.name AS lab_name
                    FROM lab_reports lrp
                    JOIN patient p ON lrp.patient_id = p.patient_id
                    JOIN users u ON p.user_id = u.user_id
                    LEFT JOIN lab l ON lrp.lab_id = l.lab_id
                    LEFT JOIN users lu ON l.user_id = lu.user_id
                    WHERE lrp.doctor_id = %s
                ) x
                ORDER BY x.uploaded_date DESC NULLS LAST
            """, (doctor_id,))
            rows = cur.fetchall()

            rows = [r for r in rows if _lab_report_file_exists(r[5])]

            total = len(rows)

        return jsonify({
            "stats": {
                "total": total,
            },
            "lab_reports": [
                {
                    "lab_report_id": r[0],
                    "patient_name": r[1],
                    "patient_id": r[2],
                    "test_name": r[3],
                    "date": str(r[4]),
                    "file_url": r[5],
                    "lab_name": r[6],
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/recent-patients  — recent patients
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/recent-patients")
@token_required
@role_required("DOCTOR")
def get_recent_patients():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT ON (p.patient_id)
                    p.patient_id,
                    u.name,
                    p.nic,
                    p.date_of_birth,
                    p.gender,
                    MAX(a.appointment_date) OVER (PARTITION BY p.patient_id) AS last_visit
                FROM appointment a
                JOIN patient p ON a.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                WHERE a.doctor_id = %s
                ORDER BY p.patient_id, last_visit DESC
                LIMIT 10
            """, (doctor_id,))
            rows = cur.fetchall()

        return jsonify([
            {
                "patient_id": r[0],
                "name": r[1],
                "nic": r[2],
                "dob": str(r[3]),
                "gender": r[4],
                "last_visit": str(r[5]),
            }
            for r in rows
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/patient/<patient_id>  — patient full profile
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/patient/<patient_id>")
@token_required
@role_required("DOCTOR")
def get_patient_profile(patient_id):
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Patient core info
            cur.execute("""
                SELECT
                    p.patient_id, u.name, p.nic, p.date_of_birth, p.gender,
                    u.contact_no1, u.address,
                    e.blood_group, e.allergies, e.chronic_conditions,
                    e.contact_name, e.contact_phone
                FROM patient p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN emergency_profile e ON p.patient_id = e.patient_id
                WHERE p.patient_id = %s
            """, (patient_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Patient not found"}), 404

            patient = {
                "patient_id": row[0],
                "name": row[1],
                "nic": row[2],
                "dob": str(row[3]),
                "gender": row[4],
                "phone": row[5],
                "address": row[6],
                "blood_group": row[7],
                "allergies": row[8],
                "chronic_conditions": row[9],
                "emergency_contact_name": row[10],
                "emergency_contact_phone": row[11],
            }

            # Appointments for this patient with this doctor
            cur.execute("""
                SELECT
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status
                FROM appointment a
                WHERE a.patient_id = %s AND a.doctor_id = %s
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
                LIMIT 10
            """, (patient_id, doctor_id))
            appt_rows = cur.fetchall()
            appointments = [
                {
                    "appointment_id": r[0],
                    "date": str(r[1]),
                    "time": str(r[2]),
                    "status": r[3],
                }
                for r in appt_rows
            ]

            # Prescriptions for this patient from this doctor
            cur.execute("""
                SELECT
                    pr.prescription_id,
                    pr.medicine_name,
                    pr.dosage,
                    pr.frequency,
                    pr.duration_days,
                    pr.status,
                    mr.visit_date
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.patient_id = %s AND mr.doctor_id = %s
                ORDER BY mr.visit_date DESC
                LIMIT 10
            """, (patient_id, doctor_id))
            rx_rows = cur.fetchall()
            prescriptions = [
                {
                    "prescription_id": r[0],
                    "medicine_name": r[1],
                    "dosage": r[2],
                    "frequency": r[3],
                    "duration_days": r[4],
                    "status": r[5],
                    "date": str(r[6]),
                }
                for r in rx_rows
            ]

            # Lab reports for this patient associated with this doctor
            cur.execute("""
                SELECT
                    x.report_id,
                    x.test_name,
                    x.uploaded_date,
                    x.file_url
                FROM (
                    SELECT
                        lr.request_id::TEXT AS report_id,
                        lr.test_name,
                        COALESCE(lr.report_uploaded_at, lr.updated_at)::DATE AS uploaded_date,
                        lr.report_file_url AS file_url
                    FROM lab_requests lr
                    WHERE lr.patient_id = %s
                      AND lr.doctor_id = %s
                      AND lr.report_file_url IS NOT NULL

                    UNION ALL

                    SELECT
                        lrp.lab_report_id::TEXT AS report_id,
                        lrp.test_name,
                        lrp.uploaded_at::DATE AS uploaded_date,
                        lrp.file_url
                    FROM lab_reports lrp
                    WHERE lrp.patient_id = %s
                      AND lrp.doctor_id = %s
                ) x
                ORDER BY x.uploaded_date DESC NULLS LAST
                LIMIT 10
            """, (patient_id, doctor_id, patient_id, doctor_id))
            lab_rows = cur.fetchall()
            lab_rows = [r for r in lab_rows if _lab_report_file_exists(r[3])]
            lab_reports = [
                {
                    "lab_report_id": r[0],
                    "test_name": r[1],
                    "date": str(r[2]),
                    "file_url": r[3],
                }
                for r in lab_rows
            ]

            # Medical records (timeline)
            cur.execute("""
                SELECT
                    mr.record_id,
                    mr.diagnosis,
                    mr.notes,
                    mr.visit_date
                FROM medical_record mr
                WHERE mr.patient_id = %s AND mr.doctor_id = %s
                ORDER BY mr.visit_date DESC
                LIMIT 10
            """, (patient_id, doctor_id))
            mr_rows = cur.fetchall()
            medical_records = [
                {
                    "record_id": r[0],
                    "diagnosis": r[1],
                    "notes": r[2],
                    "date": str(r[3]),
                }
                for r in mr_rows
            ]

        return jsonify({
            "patient": patient,
            "appointments": appointments,
            "prescriptions": prescriptions,
            "lab_reports": lab_reports,
            "medical_records": medical_records,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/appointments/<id>/status  — update appointment status
# ─────────────────────────────────────────────
@doctor_portal_bp.patch("/doctor/appointments/<appointment_id>/status")
@token_required
@role_required("DOCTOR")
def update_appointment_status(appointment_id):
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status")
    valid_statuses = ["Waiting", "Ongoing", "Conducted", "Not Conducted"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE appointment
                SET status = %s
                WHERE appointment_id = %s AND doctor_id = %s
                RETURNING appointment_id
            """, (new_status, appointment_id, doctor_id))
            updated = cur.fetchone()
            conn.commit()

        if not updated:
            return jsonify({"error": "Appointment not found or not authorized"}), 404

        return jsonify({"message": "Status updated", "appointment_id": str(updated[0])})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/availability  — get all availability slots
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/availability")
@token_required
@role_required("DOCTOR")
def get_availability():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    availability_id,
                    day_of_week,
                    start_time,
                    end_time,
                    max_patients,
                    location,
                    consultation_fee,
                    is_active
                FROM doctor_availability
                WHERE doctor_id = %s
                ORDER BY day_of_week, start_time
            """, (doctor_id,))
            rows = cur.fetchall()

        return jsonify([
            {
                "availability_id": r[0],
                "day_of_week": r[1],
                "start_time": str(r[2]),
                "end_time": str(r[3]),
                "max_patients": r[4],
                "location": r[5],
                "consultation_fee": float(r[6]) if r[6] is not None else None,
                "is_active": r[7],
            }
            for r in rows
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# POST /api/doctor/availability  — create a new availability slot
# ─────────────────────────────────────────────
@doctor_portal_bp.post("/doctor/availability")
@token_required
@role_required("DOCTOR")
def create_availability():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    data = request.get_json() or {}

    day_of_week = data.get("day_of_week")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    max_patients = data.get("max_patients", 10)
    location = data.get("location", "")
    consultation_fee = data.get("consultation_fee")
    is_active = data.get("is_active", True)

    # Validation
    if day_of_week is None or not isinstance(day_of_week, int) or not (0 <= day_of_week <= 6):
        return jsonify({"error": "day_of_week must be an integer between 0 (Sunday) and 6 (Saturday)"}), 400
    if not start_time or not end_time:
        return jsonify({"error": "start_time and end_time are required"}), 400

    # Generate an ID
    av_id = "AV" + uuid.uuid4().hex[:10].upper()

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO doctor_availability
                    (availability_id, doctor_id, day_of_week, start_time, end_time,
                     max_patients, location, consultation_fee, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING availability_id
            """, (
                av_id, doctor_id, day_of_week, start_time, end_time,
                max_patients, location, consultation_fee, is_active
            ))
            new_id = cur.fetchone()[0]
            conn.commit()

        return jsonify({"message": "Availability slot created", "availability_id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/doctor/availability/<id>  — update a slot
# ─────────────────────────────────────────────
@doctor_portal_bp.patch("/doctor/availability/<availability_id>")
@token_required
@role_required("DOCTOR")
def update_availability(availability_id):
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    data = request.get_json() or {}

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE doctor_availability SET
                    day_of_week      = COALESCE(%s, day_of_week),
                    start_time       = COALESCE(%s, start_time),
                    end_time         = COALESCE(%s, end_time),
                    max_patients     = COALESCE(%s, max_patients),
                    location         = COALESCE(%s, location),
                    consultation_fee = COALESCE(%s, consultation_fee),
                    is_active        = COALESCE(%s, is_active),
                    updated_at       = NOW()
                WHERE availability_id = %s AND doctor_id = %s
                RETURNING availability_id
            """, (
                data.get("day_of_week"),
                data.get("start_time"),
                data.get("end_time"),
                data.get("max_patients"),
                data.get("location"),
                data.get("consultation_fee"),
                data.get("is_active"),
                availability_id,
                doctor_id
            ))
            updated = cur.fetchone()
            conn.commit()

        if not updated:
            return jsonify({"error": "Slot not found or not authorized"}), 404

        return jsonify({"message": "Availability updated", "availability_id": str(updated[0])})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# DELETE /api/doctor/availability/<id>  — delete a slot
# ─────────────────────────────────────────────
@doctor_portal_bp.delete("/doctor/availability/<availability_id>")
@token_required
@role_required("DOCTOR")
def delete_availability(availability_id):
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM doctor_availability
                WHERE availability_id = %s AND doctor_id = %s
                RETURNING availability_id
            """, (availability_id, doctor_id))
            deleted = cur.fetchone()
            conn.commit()

        if not deleted:
            return jsonify({"error": "Slot not found or not authorized"}), 404

        return jsonify({"message": "Availability slot deleted"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# POST /api/doctor/consultation  — save a consultation
# Inserts into medical_record + prescription tables
# ─────────────────────────────────────────────
@doctor_portal_bp.post("/doctor/consultation")
@token_required
@role_required("DOCTOR")
def save_consultation():
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    data = request.get_json() or {}

    patient_id = data.get("patient_id")
    symptoms = data.get("symptoms", "")
    diagnosis = data.get("diagnosis", "")
    secondary_diagnosis = data.get("secondary_diagnosis", "")
    icd_code = data.get("icd_code", "")
    clinical_summary = data.get("clinical_summary", "")
    notes = data.get("notes", "")
    blood_pressure = data.get("blood_pressure", "")
    heart_rate = data.get("heart_rate", "")
    temperature = data.get("temperature", "")
    medications = data.get("medications", [])
    lab_tests = data.get("lab_tests", [])
    documents = data.get("documents", [])

    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400
    if not diagnosis:
        return jsonify({"error": "diagnosis is required"}), 400

    # Build comprehensive notes field from all the text fields
    notes_parts = []
    if symptoms:
        notes_parts.append(f"Symptoms: {symptoms}")
    if notes:
        notes_parts.append(f"Clinical Notes: {notes}")
    if blood_pressure:
        notes_parts.append(f"BP: {blood_pressure}")
    if heart_rate:
        notes_parts.append(f"HR: {heart_rate}")
    if temperature:
        notes_parts.append(f"Temp: {temperature}")
    if secondary_diagnosis:
        notes_parts.append(f"Secondary Diagnosis: {secondary_diagnosis}")
    if icd_code:
        notes_parts.append(f"ICD-10: {icd_code}")
    if clinical_summary:
        notes_parts.append(f"Summary: {clinical_summary}")
    if lab_tests:
        notes_parts.append(f"Lab Tests Requested: {', '.join(lab_tests)}")
    
    if documents:
        notes_parts.append("Attached Documents:")
        for doc in documents:
            doc_name = doc.get("name", "Document")
            doc_url = doc.get("url", "")
            if doc_url:
                notes_parts.append(f"- {doc_name}: {doc_url}")

    full_notes = "\n".join(notes_parts) if notes_parts else None

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # 1. Verify patient exists
            cur.execute(
                "SELECT patient_id FROM patient WHERE patient_id = %s",
                (patient_id,)
            )
            if not cur.fetchone():
                return jsonify({"error": "Patient not found"}), 404

            # 2. Insert medical record (record_id auto-generated by trigger)
            today = date.today()
            cur.execute("""
                INSERT INTO medical_record
                    (patient_id, doctor_id, diagnosis, notes, visit_date)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING record_id
            """, (patient_id, doctor_id, diagnosis, full_notes, today))
            record_id = cur.fetchone()[0]

            # 3. Insert prescriptions (prescription_id auto-generated by trigger)
            prescription_ids = []
            for med in medications:
                med_name = med.get("name", "").strip()
                med_dosage = med.get("dosage", "").strip()
                med_frequency = med.get("frequency", "").strip() or None
                med_duration = med.get("duration", "").strip() if med.get("duration") else None

                if not med_name or not med_dosage:
                    continue  # Skip empty medication entries

                # Parse duration to integer if possible
                duration_days = None
                if med_duration:
                    import re
                    nums = re.findall(r'\d+', med_duration)
                    if nums:
                        duration_days = int(nums[0])

                cur.execute("""
                    INSERT INTO prescription
                        (record_id, medicine_name, dosage, frequency, duration_days, status)
                    VALUES (%s, %s, %s, %s, %s, 'Issued')
                    RETURNING prescription_id
                """, (record_id, med_name, med_dosage, med_frequency, duration_days))
                prescription_ids.append(cur.fetchone()[0])

            # 4. Persist lab requests so Lab portal can list and search them.
            if lab_tests:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS lab_requests (
                        request_id VARCHAR(12) PRIMARY KEY,
                        lab_id VARCHAR(12) NOT NULL REFERENCES lab(lab_id) ON DELETE CASCADE,
                        patient_id VARCHAR(12) REFERENCES patient(patient_id) ON DELETE CASCADE,
                        doctor_id VARCHAR(12) REFERENCES doctor(doctor_id) ON DELETE SET NULL,
                        test_name VARCHAR(120) NOT NULL,
                        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        notes TEXT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        report_file_url TEXT,
                        report_file_name TEXT,
                        report_uploaded_at TIMESTAMPTZ
                    )
                    """
                )

                cur.execute("SELECT lab_id FROM lab")
                target_labs = [r[0] for r in (cur.fetchall() or [])]

                requested_tests = [str(t).strip() for t in lab_tests if str(t).strip()]
                for test_name in requested_tests:
                    for lab_id in target_labs:
                        request_id = "LRQ" + uuid.uuid4().hex[:7].upper()
                        cur.execute(
                            """
                            INSERT INTO lab_requests (
                                request_id, lab_id, patient_id, doctor_id,
                                test_name, priority, status, notes, created_at, updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, 'normal', 'pending', %s, NOW(), NOW())
                            """,
                            (
                                request_id,
                                lab_id,
                                patient_id,
                                doctor_id,
                                test_name,
                                f"Requested during consultation {record_id}",
                            ),
                        )

            conn.commit()

        return jsonify({
            "message": "Consultation saved successfully",
            "record_id": record_id,
            "prescription_ids": prescription_ids,
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/doctor/consultation/<patient_id>  — get consultation history
# ─────────────────────────────────────────────
@doctor_portal_bp.get("/doctor/consultation/<patient_id>")
@token_required
@role_required("DOCTOR")
def get_consultation_data(patient_id):
    user_id = g.user_id
    doctor_id = get_doctor_id_for_user(user_id)
    if not doctor_id:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Get patient info
            cur.execute("""
                SELECT
                    p.patient_id, u.name, p.nic, p.date_of_birth, p.gender,
                    u.contact_no1, u.address,
                    e.blood_group, e.allergies, e.chronic_conditions,
                    e.contact_name, e.contact_phone
                FROM patient p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN emergency_profile e ON p.patient_id = e.patient_id
                WHERE p.patient_id = %s
            """, (patient_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Patient not found"}), 404

            patient = {
                "patient_id": row[0],
                "name": row[1],
                "nic": row[2],
                "dob": str(row[3]),
                "gender": row[4],
                "phone": row[5],
                "address": row[6],
                "blood_group": row[7],
                "allergies": row[8],
                "chronic_conditions": row[9],
                "emergency_contact_name": row[10],
                "emergency_contact_phone": row[11],
            }

            # Get past consultations (medical records with prescriptions)
            cur.execute("""
                SELECT
                    mr.record_id,
                    mr.diagnosis,
                    mr.notes,
                    mr.visit_date,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'prescription_id', pr.prescription_id,
                            'medicine_name', pr.medicine_name,
                            'dosage', pr.dosage,
                            'frequency', pr.frequency,
                            'duration_days', pr.duration_days,
                            'status', pr.status
                        )
                    ) FILTER (WHERE pr.prescription_id IS NOT NULL) AS medications
                FROM medical_record mr
                LEFT JOIN prescription pr ON pr.record_id = mr.record_id
                WHERE mr.patient_id = %s
                GROUP BY mr.record_id, mr.diagnosis, mr.notes, mr.visit_date
                ORDER BY mr.visit_date DESC
                LIMIT 20
            """, (patient_id,))
            mr_rows = cur.fetchall()
            past_records = [
                {
                    "record_id": r[0],
                    "diagnosis": r[1],
                    "notes": r[2],
                    "date": str(r[3]),
                    "medications": r[4] or [],
                }
                for r in mr_rows
            ]

            # Check if patient has an active appointment today with this doctor
            cur.execute("""
                SELECT appointment_id, appointment_time, status
                FROM appointment
                WHERE patient_id = %s AND doctor_id = %s
                  AND appointment_date = CURRENT_DATE
                ORDER BY appointment_time
                LIMIT 1
            """, (patient_id, doctor_id))
            appt_row = cur.fetchone()
            active_appointment = None
            if appt_row:
                active_appointment = {
                    "appointment_id": appt_row[0],
                    "time": str(appt_row[1]),
                    "status": appt_row[2],
                }

        return jsonify({
            "patient": patient,
            "past_records": past_records,
            "active_appointment": active_appointment,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)
