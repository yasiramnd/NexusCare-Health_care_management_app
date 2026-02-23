from flask import Blueprint, request, jsonify
from db import get_conn
import psycopg2

appointment_bp = Blueprint("appointment_bp", __name__)

# ---------------------------
# PATIENT: Book appointment
# ---------------------------
@appointment_bp.post("/appointments")
def book_appointment():
    data = request.get_json() or {}
    required = ["patient_id", "doctor_id", "clinic_id", "appointment_date", "appointment_time"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    patient_id = data["patient_id"]
    doctor_id = data["doctor_id"]
    clinic_id = data["clinic_id"]
    date = data["appointment_date"]
    time = data["appointment_time"]

    conn = get_conn()
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            # Lock slot row to prevent race conditions
            cur.execute("""
                SELECT is_available
                FROM availability
                WHERE doctor_id=%s AND clinic_id=%s
                  AND available_date=%s AND available_time=%s
                FOR UPDATE
            """, (doctor_id, clinic_id, date, time))
            slot = cur.fetchone()

            if not slot:
                conn.rollback()
                return jsonify({"error": "Slot not found"}), 404
            if slot[0] is False:
                conn.rollback()
                return jsonify({"error": "Slot already booked"}), 409

            # Insert appointment
            cur.execute("""
                INSERT INTO appointment
                    (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, status, is_paid)
                VALUES
                    (%s, %s, %s, %s, %s, 'Waiting', FALSE)
                RETURNING appointment_id
            """, (patient_id, doctor_id, clinic_id, date, time))

            appointment_id = cur.fetchone()[0]

            # Mark slot unavailable
            cur.execute("""
                UPDATE availability
                SET is_available=FALSE
                WHERE doctor_id=%s AND clinic_id=%s
                  AND available_date=%s AND available_time=%s
            """, (doctor_id, clinic_id, date, time))

        conn.commit()
        return jsonify({"message": "Booked", "appointment_id": str(appointment_id)}), 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Time conflict (doctor/patient already booked)"}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.autocommit = True
        conn.close()


# ---------------------------
# DOCTOR: View my appointments
# ---------------------------
@appointment_bp.get("/appointments/doctor/<doctor_id>")
def doctor_appointments(doctor_id):
    date = request.args.get("date")  # optional filter
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT appointment_id, patient_id, clinic_id,
                       appointment_date, appointment_time, status, is_paid
                FROM appointment
                WHERE doctor_id = %s
            """
            params = [doctor_id]

            if date:
                sql += " AND appointment_date = %s"
                params.append(date)

            sql += " ORDER BY appointment_date, appointment_time"
            cur.execute(sql, params)
            rows = cur.fetchall()

        return jsonify([
            {
                "appointment_id": str(r[0]),
                "patient_id": r[1],
                "clinic_id": str(r[2]),
                "date": str(r[3]),
                "time": str(r[4]),
                "status": r[5],
                "is_paid": r[6],
            } for r in rows
        ])

    except Exception as e:
        # Safe for pooled connections (even for read endpoints)
        try:
            conn.rollback()
        except Exception:
            pass
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ---------------------------
# DOCTOR: Confirm appointment
# ---------------------------
@appointment_bp.patch("/appointments/<appointment_id>/confirm")
def confirm_appointment(appointment_id):
    doctor_id = (request.get_json() or {}).get("doctor_id")
    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Only the assigned doctor can confirm
            cur.execute("""
                UPDATE appointment
                SET status = 'Ongoing'
                WHERE appointment_id = %s
                  AND doctor_id = %s
                  AND status = 'Waiting'
                RETURNING appointment_id
            """, (appointment_id, doctor_id))

            updated = cur.fetchone()
            conn.commit()

        if not updated:
            return jsonify({"error": "Not found or not allowed or wrong status"}), 404

        return jsonify({"message": "Confirmed", "appointment_id": str(updated[0])})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ---------------------------
# DOCTOR: Cancel appointment
# ---------------------------
@appointment_bp.patch("/appointments/<appointment_id>/cancel")
def cancel_appointment(appointment_id):
    payload = request.get_json() or {}
    doctor_id = payload.get("doctor_id")
    reason = payload.get("reason", None)  # optional if you add a column later

    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400

    conn = get_conn()
    try:
        conn.autocommit = False
        with conn.cursor() as cur:
            # Get appointment details and lock it
            cur.execute("""
                SELECT doctor_id, clinic_id, appointment_date, appointment_time, status
                FROM appointment
                WHERE appointment_id = %s
                FOR UPDATE
            """, (appointment_id,))
            row = cur.fetchone()
            if not row:
                conn.rollback()
                return jsonify({"error": "Appointment not found"}), 404

            appt_doctor_id, clinic_id, date, time, status = row
            if str(appt_doctor_id) != str(doctor_id):
                conn.rollback()
                return jsonify({"error": "Not allowed"}), 403

            if status in ("Not Conducted", "Conducted"):
                conn.rollback()
                return jsonify({"error": "Cannot cancel in current status"}), 409

            # Cancel
            cur.execute("""
                UPDATE appointment
                SET status = 'Not Conducted'
                WHERE appointment_id = %s
            """, (appointment_id,))

            # Free slot again
            cur.execute("""
                UPDATE availability
                SET is_available = TRUE
                WHERE doctor_id=%s AND clinic_id=%s
                  AND available_date=%s AND available_time=%s
            """, (doctor_id, clinic_id, date, time))

        conn.commit()
        return jsonify({"message": "Cancelled"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.autocommit = True
        conn.close()


# ---------------------------
# DOCTOR: Mark completed
# ---------------------------
@appointment_bp.patch("/appointments/<appointment_id>/complete")
def complete_appointment(appointment_id):
    doctor_id = (request.get_json() or {}).get("doctor_id")
    if not doctor_id:
        return jsonify({"error": "doctor_id required"}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE appointment
                SET status = 'Conducted'
                WHERE appointment_id = %s
                  AND doctor_id = %s
                  AND status IN ('Waiting','Ongoing')
                RETURNING appointment_id
            """, (appointment_id, doctor_id))

            updated = cur.fetchone()
            conn.commit()

        if not updated:
            return jsonify({"error": "Not found or not allowed or wrong status"}), 404

        return jsonify({"message": "Completed", "appointment_id": str(updated[0])})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()