from flask import jsonify, request
from app.db.hospital_db import get_hospital_conn, put_hospital_conn

def book_appointment(app):

    @app.route("/appointment/book", methods=["POST"])
    def appointment():
        conn = None
        cur = None
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

            conn = get_hospital_conn()
            cur = conn.cursor()

            from datetime import datetime
            
            # ==========================
            # Check weekly schedule and occupancy
            # ==========================
            target_date = datetime.strptime(available_date, "%Y-%m-%d")
            iso_day = target_date.isoweekday()

            # 1. Get schedule for this doctor and day
            cur.execute("""
                SELECT start_time, end_time, max_patients
                FROM doctor_availability
                WHERE doctor_id = %s AND day_of_week = %s;
            """, (doctor_id, iso_day))
            
            schedule = cur.fetchone()
            if not schedule:
                return jsonify({"error": "Doctor is not available on this day of the week"}), 400

            # 2. Check if the requested time is within the schedule
            try:
                if len(available_time) > 5:
                    req_time = datetime.strptime(available_time, "%H:%M:%S").time()
                else:
                    req_time = datetime.strptime(available_time, "%H:%M").time()
            except ValueError:
                return jsonify({"error": f"Invalid time format: {available_time}"}), 400

            if not (schedule["start_time"] <= req_time < schedule["end_time"]):
                return jsonify({"error": "Requested time is outside of doctor's scheduled hours"}), 400

            # 3. Check current occupancy for this slot
            cur.execute("""
                SELECT count(*) as booked_count
                FROM appointment
                WHERE doctor_id = %s
                  AND appointment_date = %s
                  AND appointment_time = %s
                  AND status IN ('Waiting', 'Confirmed');
            """, (doctor_id, available_date, available_time))
            
            booked = cur.fetchone()["booked_count"]
            if booked >= schedule["max_patients"]:
                return jsonify({"error": "This time slot is already fully booked"}), 400

            # ==========================
            # Insert appointment
            # ==========================
            cur.execute("""
                INSERT INTO appointment (
                    patient_id,
                    doctor_id,
                    appointment_date,
                    appointment_time,
                    status,
                    is_paid
                )
                VALUES (%s, %s, %s, %s, 'Waiting', FALSE)
                RETURNING appointment_id;
            """, (patient_id, doctor_id, available_date, available_time))

            appointment_id = cur.fetchone()["appointment_id"]

            conn.commit()

            return jsonify({
                "message": "Appointment booked successfully",
                "appointment_id": appointment_id,
                "patient_id": patient_id,
                "doctor_id": doctor_id,
                "date": available_date,
                "time": available_time
            })

        except Exception as e:
            import traceback
            print(f"Booking Error: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
        finally:
            if conn:
                put_hospital_conn(conn)

    @app.route("/appointment/patient/<patient_id>", methods=["GET"])
    def get_patient_appointments(patient_id):
        """Fetches upcoming appointments for a specific patient."""
        conn = None
        cur = None
        try:
            conn = get_hospital_conn()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT 
                    a.appointment_id,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    u.name as doctor_name,
                    d.specialization
                FROM appointment a
                JOIN doctor d ON d.doctor_id = a.doctor_id
                JOIN users  u ON u.user_id   = d.user_id
                WHERE a.patient_id = %s
                  AND (a.appointment_date > CURRENT_DATE 
                       OR (a.appointment_date = CURRENT_DATE AND a.appointment_time >= CURRENT_TIME))
                ORDER BY a.appointment_date, a.appointment_time;
            """, (patient_id,))
            
            rows = cur.fetchall()
            
            # Format dates and times for JSON
            appointments = []
            for r in rows:
                appointments.append({
                    "appointment_id":   r["appointment_id"],
                    "appointment_date": r["appointment_date"].strftime("%Y-%m-%d"),
                    "appointment_time": r["appointment_time"].strftime("%H:%M"),
                    "status":           r["status"],
                    "doctor_name":      r["doctor_name"],
                    "specialization":   r["specialization"]
                })
                
            return jsonify({
                "patient_id": patient_id,
                "appointments": appointments
            })
            
        except Exception as e:
            import traceback
            print(f"Get Patient Appointments Error: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500
        finally:
            if conn:
                put_hospital_conn(conn)