from flask import jsonify, g
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn


def get_medical_records(app):

    @app.route("/patient/medical-records/<patient_id>", methods=["GET"])
    @token_required
    def medical_records(patient_id):

        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        md.diagnosis,
                        md.notes,
                        md.visit_date,
                        u.name            AS doctor_name,
                        d.specialization
                    FROM medical_record md
                    JOIN doctor d ON d.doctor_id = md.doctor_id
                    JOIN users  u ON u.user_id   = d.user_id
                    WHERE md.patient_id = %s
                    ORDER BY md.created_at DESC;
                """, (patient_id,))

                records = cur.fetchall()

            if not records:
                return jsonify({
                    "patient_id":      patient_id,
                    "medical_records": [],
                    "message":         "No medical records found"
                })

            return jsonify({
                "patient_id":      patient_id,
                "medical_records": [dict(r) for r in records]
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            put_hospital_conn(conn)
