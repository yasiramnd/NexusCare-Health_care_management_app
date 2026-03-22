from flask import request, jsonify
from db import get_db

def update_emergency_profile(app):

    @app.route("/patient/emergency-profile/update/<patient_id>", methods=["PUT"])
    def update_profile(patient_id):

        try:
            data = request.json

            contact_name = data.get("contact_name")
            contact_phone = data.get("contact_phone")
            chronic_conditions = data.get("chronic_conditions")
            blood_group = data.get("blood_group")
            allergies = data.get("allergies")
            is_public_visible = data.get("is_public_visible")

            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
                UPDATE emergency_profile
                SET
                    contact_name = %s,
                    contact_phone = %s,
                    chronic_conditions = %s,
                    blood_group = %s,
                    allergies = %s,
                    is_public_visible = %s
                WHERE patient_id = %s;
            """, (
                contact_name,
                contact_phone,
                chronic_conditions,
                blood_group,
                allergies,
                is_public_visible,
                patient_id
            ))

            conn.commit()

            cur.close()
            conn.close()

            return jsonify({
                "message": "Emergency profile updated successfully",
                "patient_id": patient_id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500