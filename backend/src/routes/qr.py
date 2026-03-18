from flask import Blueprint, request, jsonify
import psycopg2
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn

doctor_bp = Blueprint("doctor_bp", __name__)

@doctor_bp.route("/doctor/patients/by-qr", methods=["GET"])
def get_patient_by_qr():
    qr_value = request.args.get("qr")

    if not qr_value:
        return jsonify({"error": "QR value is required"}), 400

    conn = None
    try:
        conn = get_hospital_conn()
        with conn.cursor() as cur:
            # Some DBs may not have the QR_code column yet; check schema first.
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'patient'
                      AND column_name = 'qr_code'
                )
                """
            )
            has_qr_code = bool(cur.fetchone()[0])

            where_clause = "p.patient_id = %s"
            params = [qr_value]
            if has_qr_code:
                where_clause += " OR p.qr_code = %s"
                params.append(qr_value)

            cur.execute(f"""
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
                WHERE {where_clause}
            """, tuple(params))
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
    except psycopg2.OperationalError:
        return jsonify({"error": "Hospital database unavailable"}), 503
    except Exception as e:
        return jsonify({"error": f"Patient lookup failed: {str(e)}"}), 500
    finally:
        put_hospital_conn(conn)