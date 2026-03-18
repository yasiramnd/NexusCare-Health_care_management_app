from flask import Blueprint, request, jsonify, g, current_app
from src.auth_service.auth.middleware import token_required, role_required
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn
from src.auth_service.db.auth_db import get_auth_conn, put_auth_conn
from werkzeug.utils import secure_filename
import uuid, os

pharmacy_bp = Blueprint("pharmacy_bp", __name__)


# ─────────────────────────────────────────────
# POST /api/pharmacy/register-request
# Called during registration (no auth token yet)
# ─────────────────────────────────────────────
@pharmacy_bp.post("/pharmacy/register-request")
def pharmacy_register_request():
    user_id = request.form.get("user_id")
    pharmacy_name = request.form.get("pharmacy_name")
    contact_no1 = request.form.get("contact_no1")
    contact_no2 = request.form.get("contact_no2", "")
    address = request.form.get("address")
    pharmacy_license_no = request.form.get("pharmacy_license_no")
    business_reg_no = request.form.get("business_registration_number")

    if not all([user_id, pharmacy_name, contact_no1, address, pharmacy_license_no, business_reg_no]):
        return jsonify({"error": "Missing required fields"}), 400

    # Verify user_id exists in auth credentials
    auth_conn = get_auth_conn()
    try:
        with auth_conn.cursor() as cur:
            cur.execute("SELECT role FROM credentials WHERE user_id = %s", (user_id,))
            row = cur.fetchone()
            if not row or row[0] != "PHARMACY":
                return jsonify({"error": "Invalid user_id or not a pharmacy account"}), 400
    finally:
        put_auth_conn(auth_conn)

    # Handle file upload
    business_reg_url = ""
    file = request.files.get("business_registration_doc")
    if file and file.filename:
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        business_reg_url = f"/uploads/{unique_filename}"

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Check if user already exists in hospital DB
            cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO users (user_id, name, contact_no1, contact_no2, address)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, pharmacy_name, contact_no1, contact_no2, address))

            # Check if pharmacy record already exists
            cur.execute("SELECT pharmacy_id FROM pharmacy WHERE user_id = %s", (user_id,))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO pharmacy
                        (pharmacy_id, user_id, pharmacy_license_no,
                         business_registration_number, business_registration_url,
                         available_date, available_time)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_DATE, '09:00')
                """, (
                    'PAH' + str(uuid.uuid4().int)[:4],
                    user_id,
                    pharmacy_license_no,
                    business_reg_no,
                    business_reg_url,
                ))

            conn.commit()
        return jsonify({"message": "Pharmacy profile created successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/pharmacy/me  — pharmacy profile
# ─────────────────────────────────────────────
@pharmacy_bp.get("/pharmacy/me")
@token_required
@role_required("PHARMACY")
def get_pharmacy_me():
    user_id = g.user_id

    # Get email and verification from auth DB
    conn2 = get_auth_conn()
    email = None
    is_active = False
    username = None
    try:
        with conn2.cursor() as cur2:
            cur2.execute(
                "SELECT email, is_active, username FROM credentials WHERE user_id = %s",
                (user_id,)
            )
            cred_row = cur2.fetchone()
            if cred_row:
                email = cred_row[0]
                is_active = cred_row[1]
                username = cred_row[2]
    finally:
        put_auth_conn(conn2)

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    ph.pharmacy_id,
                    u.name,
                    u.contact_no1,
                    u.contact_no2,
                    u.address,
                    ph.pharmacy_license_no,
                    ph.business_registration_number,
                    ph.business_registration_url,
                    ph.available_date,
                    ph.available_time
                FROM pharmacy ph
                JOIN users u ON ph.user_id = u.user_id
                WHERE ph.user_id = %s
            """, (user_id,))
            row = cur.fetchone()

            # Auto-create hospital records if missing (registration Step 2 failed)
            if not row:
                display_name = username or (email.split("@")[0] if email else "Pharmacy")
                cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
                if not cur.fetchone():
                    cur.execute("""
                        INSERT INTO users (user_id, name, contact_no1, address)
                        VALUES (%s, %s, %s, %s)
                    """, (user_id, display_name, '', ''))

                cur.execute("SELECT pharmacy_id FROM pharmacy WHERE user_id = %s", (user_id,))
                if not cur.fetchone():
                    import uuid as _uuid
                    cur.execute("""
                        INSERT INTO pharmacy
                            (pharmacy_id, user_id, pharmacy_license_no,
                             business_registration_number, business_registration_url,
                             available_date, available_time)
                        VALUES (%s, %s, %s, %s, %s, CURRENT_DATE, '09:00')
                    """, (
                        'PAH' + str(_uuid.uuid4().int)[:4],
                        user_id, '', '', '',
                    ))
                conn.commit()

                # Re-fetch after creation
                cur.execute("""
                    SELECT
                        ph.pharmacy_id, u.name, u.contact_no1, u.contact_no2, u.address,
                        ph.pharmacy_license_no, ph.business_registration_number,
                        ph.business_registration_url, ph.available_date, ph.available_time
                    FROM pharmacy ph
                    JOIN users u ON ph.user_id = u.user_id
                    WHERE ph.user_id = %s
                """, (user_id,))
                row = cur.fetchone()

            verification = "Approved" if is_active else "Pending"

            return jsonify({
                "pharmacy_id": row[0],
                "name": row[1],
                "phone": row[2],
                "phone2": row[3],
                "address": row[4],
                "pharmacy_license_no": row[5],
                "business_registration_number": row[6],
                "business_registration_url": row[7],
                "available_date": str(row[8]) if row[8] else None,
                "available_time": str(row[9]) if row[9] else None,
                "email": email,
                "verification": verification,
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/pharmacy/me  — update pharmacy profile
# ─────────────────────────────────────────────
@pharmacy_bp.patch("/pharmacy/me")
@token_required
@role_required("PHARMACY")
def update_pharmacy_me():
    user_id = g.user_id
    data = request.get_json() or {}

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE users SET
                    name = COALESCE(%s, name),
                    contact_no1 = COALESCE(%s, contact_no1),
                    contact_no2 = COALESCE(%s, contact_no2),
                    address = COALESCE(%s, address)
                WHERE user_id = %s
            """, (
                data.get("name"),
                data.get("phone"),
                data.get("phone2"),
                data.get("address"),
                user_id
            ))
            cur.execute("""
                UPDATE pharmacy SET
                    available_date = COALESCE(%s, available_date),
                    available_time = COALESCE(%s, available_time)
                WHERE user_id = %s
            """, (
                data.get("available_date"),
                data.get("available_time"),
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
# GET /api/pharmacy/patient/lookup?qr=<patient_id_or_qr>
# ─────────────────────────────────────────────
@pharmacy_bp.get("/pharmacy/patient/lookup")
@token_required
@role_required("PHARMACY")
def lookup_patient():
    qr_value = request.args.get("qr")
    if not qr_value:
        return jsonify({"error": "Patient ID or QR value is required"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.patient_id,
                    u.name,
                    u.contact_no1,
                    u.address,
                    p.gender,
                    p.date_of_birth,
                    e.blood_group,
                    e.allergies,
                    e.chronic_conditions
                FROM patient p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN emergency_profile e ON p.patient_id = e.patient_id
                WHERE p.patient_id = %s
                   OR p.QR_code = %s
            """, (qr_value, qr_value))
            patient = cur.fetchone()

            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            patient_id = patient[0]

            # Count active prescriptions (status = 'Issued')
            cur.execute("""
                SELECT COUNT(*)
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                WHERE mr.patient_id = %s AND pr.status = 'Issued'
            """, (patient_id,))
            active_count = cur.fetchone()[0]

            # Get last visit date
            cur.execute("""
                SELECT MAX(visit_date)
                FROM medical_record
                WHERE patient_id = %s
            """, (patient_id,))
            last_visit_row = cur.fetchone()
            last_visit = str(last_visit_row[0]) if last_visit_row and last_visit_row[0] else None

            return jsonify({
                "patient_id": patient[0],
                "name": patient[1],
                "contact_no": patient[2],
                "address": patient[3],
                "gender": patient[4],
                "date_of_birth": str(patient[5]) if patient[5] else None,
                "blood_group": patient[6],
                "allergies": patient[7],
                "chronic_conditions": patient[8],
                "active_prescriptions": active_count,
                "last_visit": last_visit,
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/pharmacy/patient/<patient_id>/prescriptions
# ─────────────────────────────────────────────
@pharmacy_bp.get("/pharmacy/patient/<patient_id>/prescriptions")
@token_required
@role_required("PHARMACY")
def get_patient_prescriptions(patient_id):
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    pr.prescription_id,
                    pr.medicine_name,
                    pr.dosage,
                    pr.frequency,
                    pr.duration_days,
                    pr.status,
                    pr.created_at,
                    mr.record_id,
                    mr.diagnosis,
                    mr.visit_date,
                    d.doctor_id,
                    u.name AS doctor_name,
                    d.specialization
                FROM prescription pr
                JOIN medical_record mr ON pr.record_id = mr.record_id
                JOIN doctor d ON mr.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE mr.patient_id = %s
                ORDER BY pr.created_at DESC
            """, (patient_id,))
            rows = cur.fetchall()

            prescriptions = []
            for r in rows:
                prescriptions.append({
                    "prescription_id": r[0],
                    "medicine_name": r[1],
                    "dosage": r[2],
                    "frequency": r[3],
                    "duration_days": r[4],
                    "status": r[5],
                    "created_at": str(r[6]),
                    "record_id": r[7],
                    "diagnosis": r[8],
                    "visit_date": str(r[9]),
                    "doctor_id": r[10],
                    "doctor_name": r[11],
                    "specialization": r[12],
                })

            return jsonify({"prescriptions": prescriptions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/pharmacy/prescription/<prescription_id>/status
# ─────────────────────────────────────────────
@pharmacy_bp.patch("/pharmacy/prescription/<prescription_id>/status")
@token_required
@role_required("PHARMACY")
def update_prescription_status(prescription_id):
    body = request.get_json(silent=True) or {}
    new_status = body.get("status")

    if new_status not in ("Ordered", "Taken"):
        return jsonify({"error": "Status must be 'Ordered' or 'Taken'"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE prescription
                SET status = %s
                WHERE prescription_id = %s
                RETURNING prescription_id
            """, (new_status, prescription_id))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Prescription not found"}), 404
            conn.commit()
            return jsonify({"message": "Status updated", "prescription_id": row[0], "status": new_status})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/pharmacy/orders/normal
# List normal orders for the logged-in pharmacy
# ─────────────────────────────────────────────
@pharmacy_bp.get("/pharmacy/orders/normal")
@token_required
@role_required("PHARMACY")
def get_normal_orders():
    user_id = g.user_id
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Resolve pharmacy_id
            cur.execute("SELECT pharmacy_id FROM pharmacy WHERE user_id = %s", (user_id,))
            ph_row = cur.fetchone()
            if not ph_row:
                return jsonify({"error": "Pharmacy profile not found"}), 404
            pharmacy_id = ph_row[0]

            cur.execute("""
                SELECT
                    no.order_id,
                    no.patient_id,
                    no.prescription_id,
                    no.total_price,
                    no.is_prepared,
                    u.name AS patient_name,
                    u.contact_no1,
                    pr.medicine_name,
                    pr.dosage,
                    pr.frequency,
                    pr.duration_days
                FROM normal_order no
                JOIN patient p ON no.patient_id = p.patient_id
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN prescription pr ON no.prescription_id = pr.prescription_id
                WHERE no.pharmacy_id = %s
                ORDER BY no.is_prepared ASC, no.order_id DESC
            """, (pharmacy_id,))
            rows = cur.fetchall()

            orders = []
            for r in rows:
                orders.append({
                    "order_id": r[0],
                    "patient_id": r[1],
                    "prescription_id": r[2],
                    "total_price": r[3],
                    "is_prepared": r[4],
                    "patient_name": r[5],
                    "contact_no": r[6],
                    "medicine_name": r[7],
                    "dosage": r[8],
                    "frequency": r[9],
                    "duration_days": r[10],
                })

            return jsonify({"orders": orders})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/pharmacy/orders/normal/<order_id>
# Mark a normal order as prepared / not prepared
# ─────────────────────────────────────────────
@pharmacy_bp.patch("/pharmacy/orders/normal/<order_id>")
@token_required
@role_required("PHARMACY")
def update_normal_order(order_id):
    user_id = g.user_id
    body = request.get_json(silent=True) or {}
    is_prepared = body.get("is_prepared")

    if is_prepared is None or not isinstance(is_prepared, bool):
        return jsonify({"error": "is_prepared (boolean) is required"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Verify order belongs to this pharmacy
            cur.execute("""
                SELECT no.order_id
                FROM normal_order no
                JOIN pharmacy ph ON no.pharmacy_id = ph.pharmacy_id
                WHERE no.order_id = %s AND ph.user_id = %s
            """, (order_id, user_id))
            if not cur.fetchone():
                return jsonify({"error": "Order not found"}), 404

            cur.execute("""
                UPDATE normal_order SET is_prepared = %s WHERE order_id = %s
            """, (is_prepared, order_id))
            conn.commit()

        return jsonify({"message": "Order updated", "order_id": order_id, "is_prepared": is_prepared})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# GET /api/pharmacy/availability
# ─────────────────────────────────────────────
@pharmacy_bp.get("/pharmacy/availability")
@token_required
@role_required("PHARMACY")
def get_pharmacy_availability():
    user_id = g.user_id
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pharmacy_id FROM pharmacy WHERE user_id = %s", (user_id,))
            ph_row = cur.fetchone()
            if not ph_row:
                return jsonify({"error": "Pharmacy profile not found"}), 404
            pharmacy_id = ph_row[0]

            cur.execute("""
                SELECT availability_id, day_of_week, start_time, end_time, is_active
                FROM pharmacy_availability
                WHERE pharmacy_id = %s
                ORDER BY day_of_week, start_time
            """, (pharmacy_id,))
            rows = cur.fetchall()

            slots = []
            for r in rows:
                slots.append({
                    "availability_id": r[0],
                    "day_of_week": r[1],
                    "start_time": str(r[2])[:5],
                    "end_time": str(r[3])[:5],
                    "is_active": r[4],
                })

            return jsonify({"pharmacy_id": pharmacy_id, "slots": slots})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# POST /api/pharmacy/availability
# ─────────────────────────────────────────────
@pharmacy_bp.post("/pharmacy/availability")
@token_required
@role_required("PHARMACY")
def add_pharmacy_availability():
    user_id = g.user_id
    body = request.get_json(silent=True) or {}
    day_of_week = body.get("day_of_week")
    start_time = body.get("start_time")
    end_time = body.get("end_time")

    if day_of_week is None or start_time is None or end_time is None:
        return jsonify({"error": "day_of_week, start_time, and end_time are required"}), 400

    if not isinstance(day_of_week, int) or day_of_week < 0 or day_of_week > 6:
        return jsonify({"error": "day_of_week must be 0-6 (Sun-Sat)"}), 400

    if start_time >= end_time:
        return jsonify({"error": "end_time must be after start_time"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pharmacy_id FROM pharmacy WHERE user_id = %s", (user_id,))
            ph_row = cur.fetchone()
            if not ph_row:
                return jsonify({"error": "Pharmacy profile not found"}), 404
            pharmacy_id = ph_row[0]

            cur.execute("""
                INSERT INTO pharmacy_availability (pharmacy_id, day_of_week, start_time, end_time)
                VALUES (%s, %s, %s, %s)
                RETURNING availability_id
            """, (pharmacy_id, day_of_week, start_time, end_time))
            new_id = cur.fetchone()[0]
            conn.commit()

            return jsonify({
                "message": "Availability slot added",
                "availability_id": new_id,
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
                "is_active": True,
            }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# PATCH /api/pharmacy/availability/<availability_id>
# ─────────────────────────────────────────────
@pharmacy_bp.patch("/pharmacy/availability/<availability_id>")
@token_required
@role_required("PHARMACY")
def update_pharmacy_availability(availability_id):
    user_id = g.user_id
    body = request.get_json(silent=True) or {}

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Verify slot belongs to this pharmacy
            cur.execute("""
                SELECT pa.availability_id
                FROM pharmacy_availability pa
                JOIN pharmacy ph ON pa.pharmacy_id = ph.pharmacy_id
                WHERE pa.availability_id = %s AND ph.user_id = %s
            """, (availability_id, user_id))
            if not cur.fetchone():
                return jsonify({"error": "Availability slot not found"}), 404

            updates = []
            params = []
            if "day_of_week" in body:
                d = body["day_of_week"]
                if not isinstance(d, int) or d < 0 or d > 6:
                    return jsonify({"error": "day_of_week must be 0-6"}), 400
                updates.append("day_of_week = %s")
                params.append(d)
            if "start_time" in body:
                updates.append("start_time = %s")
                params.append(body["start_time"])
            if "end_time" in body:
                updates.append("end_time = %s")
                params.append(body["end_time"])
            if "is_active" in body:
                updates.append("is_active = %s")
                params.append(body["is_active"])

            if not updates:
                return jsonify({"error": "No fields to update"}), 400

            updates.append("updated_at = NOW()")
            params.append(availability_id)

            cur.execute(
                f"UPDATE pharmacy_availability SET {', '.join(updates)} WHERE availability_id = %s",
                params
            )
            conn.commit()

            return jsonify({"message": "Availability slot updated", "availability_id": availability_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)


# ─────────────────────────────────────────────
# DELETE /api/pharmacy/availability/<availability_id>
# ─────────────────────────────────────────────
@pharmacy_bp.delete("/pharmacy/availability/<availability_id>")
@token_required
@role_required("PHARMACY")
def delete_pharmacy_availability(availability_id):
    user_id = g.user_id
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM pharmacy_availability pa
                USING pharmacy ph
                WHERE pa.pharmacy_id = ph.pharmacy_id
                  AND pa.availability_id = %s
                  AND ph.user_id = %s
                RETURNING pa.availability_id
            """, (availability_id, user_id))
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Availability slot not found"}), 404
            conn.commit()

            return jsonify({"message": "Availability slot deleted", "availability_id": availability_id})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)
