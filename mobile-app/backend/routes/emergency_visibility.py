from flask import request, jsonify
from db import get_db

def update_emergency_visibility(app):

    @app.route("/patient/emergency-profile/visibility/<patient_id>", methods=["PUT"])
    def update_visibility(patient_id):

        try:
            data = request.json
            is_public_visible = data.get("is_public_visible")

            conn = get_db()
            cur = conn.cursor()

            cur.execute("""
                UPDATE emergency_profile
                SET is_public_visible = %s
                WHERE patient_id = %s;
            """, (is_public_visible, patient_id))

            conn.commit()

            cur.close()
            conn.close()

            return jsonify({
                "message": "Emergency profile visibility updated",
                "patient_id": patient_id,
                "is_public_visible": is_public_visible
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500