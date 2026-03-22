from flask import jsonify
from app.db.hospital_db import get_hospital_conn

def get_lab_reports(app):

    @app.route("/patient/lab-reports/<patient_id>", methods=["GET"])
    def lab_reports(patient_id):

        try:
            conn = get_hospital_conn()
            cur = conn.cursor()

            cur.execute("""
    SELECT
        lr.lab_report_id,
        lr.test_name,
        lr.file_url,
        lr.uploaded_at AS report_date,
        ud.name AS doctor_name,
        ul.name AS lab_name
    FROM lab_reports lr
    JOIN doctor d ON d.doctor_id = lr.doctor_id
    JOIN users ud ON d.user_id = ud.user_id
    JOIN lab l ON l.lab_id = lr.lab_id
    JOIN users ul ON l.user_id = ul.user_id
    WHERE lr.patient_id = %s
    ORDER BY lr.uploaded_at DESC;
""", (patient_id,))

            reports = cur.fetchall()

            cur.close()
            conn.close()

            return jsonify({
                "patient_id": patient_id,
                "lab_reports": reports
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500



def get_requested_lab_reports(app):

    @app.route("/patient/lab-reports/requested/<patient_id>", methods=["GET"])
    def requested_lab_reports(patient_id):

        try:
            conn = get_hospital_conn()
            cur = conn.cursor()

            cur.execute("""
                SELECT
                    lr.request_id,
                    lr.test_name,
                    lr.priority,
                    ud.name AS doctor_name,
                    ul.name AS lab_name
                FROM lab_requests lr
                JOIN doctor d ON d.doctor_id = lr.doctor_id
                JOIN users ud ON d.user_id = ud.user_id
                JOIN lab l ON l.lab_id = lr.lab_id
                JOIN users ul ON l.user_id = ul.user_id
                WHERE lr.patient_id = %s;
            """, (patient_id,))

            reports = cur.fetchall()

            cur.close()
            conn.close()

            return jsonify({
                "patient_id": patient_id,
                "requested_lab_reports": reports
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500