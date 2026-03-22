from flask import jsonify, g
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn


def get_available_times(app):

    @app.route("/doctor/available-times/<doctor_id>/<available_date>", methods=["GET"])
    @token_required
    def available_times(doctor_id, available_date):
        from datetime import datetime, timedelta
        
        try:
            # Parse the input date
            target_date = datetime.strptime(available_date, "%Y-%m-%d")
            iso_day = target_date.isoweekday() # 1=Mon, ..., 7=Sun
            
            conn = get_hospital_conn()
            with conn.cursor() as cur:
                # Query the weekly schedule
                cur.execute("""
                    SELECT 
                        u.name as doctor_name,
                        d.specialization,
                        da.day_of_week,
                        da.start_time,
                        da.end_time,
                        da.max_patients
                    FROM doctor_availability da
                    JOIN doctor d ON d.doctor_id = da.doctor_id
                    JOIN users  u ON u.user_id   = d.user_id
                    WHERE da.doctor_id = %s
                    ORDER BY da.day_of_week, da.start_time;
                """, (doctor_id,))
                rows = cur.fetchall()

                # Query existing appointments for this doctor to filter them out
                cur.execute("""
                    SELECT appointment_date, appointment_time, count(*) as booked_count
                    FROM appointment
                    WHERE doctor_id = %s
                      AND appointment_date >= CURRENT_DATE
                      AND status IN ('Waiting', 'Confirmed')
                    GROUP BY appointment_date, appointment_time;
                """, (doctor_id,))
                appointments = cur.fetchall()
                # Create a map of (date, time) -> booked_count
                booked_map = {
                    (r['appointment_date'].strftime("%Y-%m-%d"), 
                     r['appointment_time'].strftime("%H:%M")): r['booked_count'] 
                    for r in appointments
                }

            if not rows:
                return jsonify({
                    "doctor_id":      doctor_id,
                    "available_date": available_date,
                    "available_times": [],
                    "message": "No schedule found for this doctor on the selected day of week"
                })

            # Generate slots for this specific date
            slots = []
            date_str = target_date.strftime("%Y-%m-%d")
            for row in rows:
                start_dt = datetime.combine(target_date.date(), row["start_time"])
                end_dt = datetime.combine(target_date.date(), row["end_time"])
                max_pts = row.get("max_patients", 1)
                
                curr_slot = start_dt
                while curr_slot < end_dt:
                    time_str = curr_slot.strftime("%H:%M")
                    # Check if slot is full
                    booked = booked_map.get((date_str, time_str), 0)
                    if booked < max_pts:
                        slots.append(time_str)
                    curr_slot += timedelta(minutes=30)

            return jsonify({
                "doctor_id":      doctor_id,
                "doctor_name":    rows[0]["doctor_name"],
                "specialization": rows[0]["specialization"],
                "available_date": available_date,
                "available_times": slots
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if conn:
                put_hospital_conn(conn)

    @app.route("/doctor/availability/<doctor_id>", methods=["GET"])
    @token_required
    def get_all_doctor_availability(doctor_id):
        """Fetches all future available slots for a given doctor from the weekly schedule."""
        from datetime import datetime, timedelta
        
        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                # Query the weekly schedule from doctor_availability
                cur.execute("""
                    SELECT 
                        u.name as doctor_name,
                        d.specialization,
                        da.day_of_week,
                        da.start_time,
                        da.end_time,
                        da.max_patients
                    FROM doctor_availability da
                    JOIN doctor d ON d.doctor_id = da.doctor_id
                    JOIN users  u ON u.user_id   = d.user_id
                    WHERE da.doctor_id = %s
                    ORDER BY da.day_of_week, da.start_time;
                """, (doctor_id,))

                rows = cur.fetchall()

                # Query existing appointments
                cur.execute("""
                    SELECT appointment_date, appointment_time, count(*) as booked_count
                    FROM appointment
                    WHERE doctor_id = %s
                      AND appointment_date >= CURRENT_DATE
                      AND status IN ('Waiting', 'Confirmed')
                    GROUP BY appointment_date, appointment_time;
                """, (doctor_id,))
                appointments = cur.fetchall()
                booked_map = {
                    (r['appointment_date'].strftime("%Y-%m-%d"), 
                     r['appointment_time'].strftime("%H:%M")): r['booked_count'] 
                    for r in appointments
                }

            if not rows:
                return jsonify({
                    "doctor_id": doctor_id,
                    "availability": {},
                    "message": "No recurring schedule found for this doctor"
                })

            doctor_name = rows[0]["doctor_name"]
            specialization = rows[0]["specialization"]
            
            # Generate slots for the next 4 weeks
            availability_map = {}
            today = datetime.now()
            
            for i in range(28): # Next 28 days
                current_date = today + timedelta(days=i)
                # ISO weekday: 1 (Mon) to 7 (Sun)
                # If your table uses different mapping, adjust here.
                # Screenshot showed 1, 2, 3, 5. Usually 1=Mon.
                iso_day = current_date.isoweekday() 
                
                for row in rows:
                    if row["day_of_week"] == iso_day:
                        date_str = current_date.strftime("%Y-%m-%d")
                        if date_str not in availability_map:
                            availability_map[date_str] = []
                        
                        start_dt = datetime.combine(current_date.date(), row["start_time"])
                        end_dt = datetime.combine(current_date.date(), row["end_time"])
                        max_pts = row.get("max_patients", 1)
                        
                        curr_slot = start_dt
                        while curr_slot < end_dt:
                            time_str = curr_slot.strftime("%H:%M")
                            booked = booked_map.get((date_str, time_str), 0)
                            if booked < max_pts:
                                availability_map[date_str].append(time_str)
                            curr_slot += timedelta(minutes=30)

            return jsonify({
                "doctor_id":      doctor_id,
                "doctor_name":    doctor_name,
                "specialization": specialization,
                "availability":   availability_map
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if conn:
                put_hospital_conn(conn)
