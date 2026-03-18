from flask import jsonify, request
from db import get_db

def book_appointment(app):

    @app.route("/appointment/book", methods=["POST"])
    def appointment():

        try:
            data = request.get_json()

            # ==========================
            # Extract parameters
            # ==========================
            patient_id = data.get("patient_id")
            doctor_id = data.get("doctor_id")
            available_date = data.get("available_date")
            available_time = data.get("available_time")

            # ==========================
            # Validate input
            # ==========================
            if not all([patient_id, doctor_id, available_date, available_time]):
                return jsonify({"error": "Missing required fields"}), 400

            conn = get_db()
            cur = conn.cursor()

            # ==========================
            # Check availability
            # ==========================
            cur.execute("""
                SELECT is_available, clinic_id
                FROM availability
                WHERE doctor_id = %s
                AND available_date = %s
                AND available_time = %s;
            """, (doctor_id, available_date, available_time))

            slot = cur.fetchone()

            if not slot or not slot["is_available"]:
                return jsonify({"error": "Selected time slot is not available"}), 400

            clinic_id = slot["clinic_id"]

            # ==========================
            # Insert appointment
            # ==========================
            cur.execute("""
                INSERT INTO appointment (
                    patient_id,
                    doctor_id,
                    clinic_id,
                    appointment_date,
                    appointment_time,
                    status,
                    is_paid
                )
                VALUES (%s, %s, %s, %s, %s, 'Waiting', FALSE)
                RETURNING appointment_id;
            """, (patient_id, doctor_id, clinic_id, available_date, available_time))

            appointment_id = cur.fetchone()["appointment_id"]

            # ==========================
            # Update availability
            # ==========================
            cur.execute("""
                UPDATE availability
                SET is_available = FALSE
                WHERE doctor_id = %s
                AND available_date = %s
                AND available_time = %s;
            """, (doctor_id, available_date, available_time))

            conn.commit()

            cur.close()
            conn.close()

            return jsonify({
                "message": "Appointment booked successfully",
                "appointment_id": appointment_id,
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "clinic_id": clinic_id,
                "date": available_date,
                "time": available_time
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500