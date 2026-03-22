from flask import jsonify
from db import get_db

def get_available_times(app):

    @app.route("/doctor/available-times/<doctor_id>/<available_date>", methods=["GET"])
    def available_times(doctor_id, available_date):

        try:
            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
                SELECT 
                    u.name,
                    d.specialization,
                    a.available_time
                FROM availability a
                JOIN doctor d ON d.doctor_id = a.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE a.is_available = 'True' AND a.doctor_id = %s
                AND a.available_date = %s;
            """, (doctor_id, available_date))

            availability = cur.fetchall()

            if not availability:
                return jsonify({
                    "doctor_id": doctor_id,
                    "available_date": available_date,
                    "error": "No available slots on selected date"
                })

            doctor_name = availability[0]["name"]
            specialization = availability[0]["specialization"]

            available_slots = []

            for row in availability:
                  available_slots.append(
                       row["available_time"].strftime("%H:%M")
                    )

            cur.close()
            conn.close()

            return jsonify({
                "doctor_id": doctor_id,
                "doctor_name": doctor_name,
                "specialization": specialization,
                "available_date": available_date,
                "available_times": available_slots
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500