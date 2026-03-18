from flask import jsonify
from db import get_db

def get_prescriptions(app):

    @app.route("/patient/prescriptions/<patient_id>", methods=["GET"])
    def prescriptions(patient_id):

        try:
            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
    SELECT
        p.medicine_name,
        p.prescription_id,
        p.record_id,
        p.dosage,
        p.frequency,
        p.duration_days,
        p.status,
        u.name AS doctor_name
    FROM prescription p
    JOIN medical_record md ON p.record_id = md.record_id
    JOIN doctor d ON d.doctor_id = md.doctor_id
    JOIN users u ON u.user_id = d.user_id
    WHERE md.patient_id = %s
    ORDER BY p.created_at DESC;
""", (patient_id,))

            prescriptions = cur.fetchall()

            cur.close()
            conn.close()

            if not prescriptions:
                return jsonify({
                "patient_id": patient_id,
                "error":"No medical records found"
            })

            return jsonify({
                "patient_id": patient_id,
                "prescriptions": prescriptions
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500