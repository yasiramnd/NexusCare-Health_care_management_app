from flask import Blueprint, request, jsonify
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn

doctor_bp = Blueprint("doctor_bp", __name__)

@doctor_bp.route("/doctor/patients/by-qr", methods=["GET"])
def get_patient_by_qr():
    qr_value = request.args.get("qr")

    if not qr_value:
        return jsonify({"error": "QR value is required"}), 400

    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.patient_id,
                    u.name,
                    u.contact_no1,
                    u.address,
                    p.gender,
                    p.date_of_birth,
                    e.contact_name  AS emergency_contact_name,
                    e.contact_phone AS emergency_contact_phone,
                    e.blood_group,
                    e.allergies,
                    e.chronic_conditions
                FROM patient p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN emergency_profile e ON p.patient_id = e.patient_id
                WHERE p.patient_id = %s
                   OR p.QR_code = %s
            """, (qr_value, qr_value))
            patient = cur.fetchone()

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        return jsonify({
            "patient_id":    patient[0],
            "name":          patient[1],
            "contact_no":    patient[2],
            "address":       patient[3],
            "gender":        patient[4],
            "date_of_birth": str(patient[5]),
            "emergency_contact": {
                "name":  patient[6],
                "phone": patient[7],
            },
            "blood_group":        patient[8],
            "allergies":          patient[9],
            "chronic_conditions": patient[10],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)