from flask import jsonify
from db import get_db

def get_medical_records(app):

    @app.route("/patient/medical-records/<patient_id>", methods=["GET"])
    def medical_records(patient_id):

        try:
            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
    SELECT
        md.diagnosis,
        md.notes,
        md.visit_date,
        u.name AS doctor_name,
        d.specialization AS specialization
    FROM medical_record md
    JOIN doctor d
        ON d.doctor_id = md.doctor_id
    JOIN users u
        ON u.user_id = d.user_id
    WHERE md.patient_id = %s
    ORDER BY md.created_at DESC;
""", (patient_id,))

            records = cur.fetchall()

            cur.close()
            conn.close()

            if not records:
                return jsonify({
                "patient_id": patient_id,
                "error":"No medical records found"
            })

            return jsonify({
                "patient_id": patient_id,
                "medical_records": records
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500