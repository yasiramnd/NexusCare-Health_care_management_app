from flask import request, jsonify, g
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn


def update_emergency_visibility(app):

    @app.route("/patient/emergency-profile/visibility/<patient_id>", methods=["PUT"])
    @token_required
    def update_visibility(patient_id):

        data              = request.get_json() or {}
        is_public_visible = data.get("is_public_visible")

        if is_public_visible is None:
            return jsonify({"error": "is_public_visible field is required"}), 400

        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE emergency_profile
                    SET is_public_visible = %s
                    WHERE patient_id = %s
                    RETURNING patient_id;
                """, (is_public_visible, patient_id))

                updated = cur.fetchone()
                if not updated:
                    return jsonify({"error": "Emergency profile not found for this patient"}), 404

                conn.commit()

            return jsonify({
                "message":          "Emergency profile visibility updated",
                "patient_id":       patient_id,
                "is_public_visible": is_public_visible
            })

        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            put_hospital_conn(conn)
