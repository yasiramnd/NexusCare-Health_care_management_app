from flask import jsonify, g
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn


def get_prescriptions(app):

    @app.route("/patient/prescriptions/<patient_id>", methods=["GET"])
    @token_required
    def prescriptions(patient_id):

        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        p.prescription_id,
                        p.medicine_name,
                        p.record_id,
                        p.dosage,
                        p.frequency,
                        p.duration_days,
                        p.status,
                        u.name AS doctor_name
                    FROM prescription p
                    JOIN medical_record md ON md.record_id  = p.record_id
                    JOIN doctor         d  ON d.doctor_id   = md.doctor_id
                    JOIN users          u  ON u.user_id     = d.user_id
                    WHERE md.patient_id = %s
                    ORDER BY p.created_at DESC;
                """, (patient_id,))

                rows = cur.fetchall()

            if not rows:
                return jsonify({
                    "patient_id":    patient_id,
                    "prescriptions": [],
                    "message":       "No prescriptions found"
                })

            return jsonify({
                "patient_id":    patient_id,
                "prescriptions": [dict(r) for r in rows]
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            put_hospital_conn(conn)
