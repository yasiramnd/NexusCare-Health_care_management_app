from flask import Blueprint, jsonify
from src.auth_service.db.hospital_db import get_hospital_conn, put_hospital_conn

emergency_bp = Blueprint("emergency_bp", __name__)

@emergency_bp.route("/<patient_id>", methods=["GET"])
def get_emergency_profile(patient_id):
    conn = get_hospital_conn()
    try:
        with conn.cursor() as cur:
            # Check if patient exists and get emergency details
            cur.execute("""
                SELECT 
                    u.name,
                    u.address,
                    p.gender,
                    e.contact_name,
                    e.contact_phone,
                    e.chronic_conditions,
                    e.blood_group,
                    e.allergies,
                    e.is_public_visible
                FROM patient p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN emergency_profile e ON p.patient_id = e.patient_id
                WHERE p.patient_id = %s OR p.QR_code = %s
            """, (patient_id, patient_id))
            
            record = cur.fetchone()
            
            if not record:
                return jsonify({"message": "No record found"}), 404
                
            # If there's a record but no emergency profile, it might have NULLs for emergency fields
            # We must check if emergency_profile actually exists and what its visibility is.
            is_public_visible = record[8]
            
            if is_public_visible is False:
                return jsonify({"message": "Profile not public visible"}), 403
                
            return jsonify({
                "name": record[0],
                "address": record[1],
                "gender": record[2],
                "contact_name": record[3] if record[3] else "N/A",
                "contact_phone": record[4] if record[4] else "N/A",
                "chronic_conditions": record[5] if record[5] else "None",
                "blood_group": record[6] if record[6] else "Unknown",
                "allergies": record[7] if record[7] else "None"
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        put_hospital_conn(conn)
