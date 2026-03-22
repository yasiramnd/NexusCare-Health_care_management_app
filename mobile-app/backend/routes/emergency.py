from flask import request, jsonify, g
from app.auth.middleware import token_required
from app.db.hospital_db import get_hospital_conn, put_hospital_conn


def update_emergency_profile(app):

    # ── Update full emergency profile (patient only) ──────────────────────────
    @app.route("/patient/emergency-profile/update/<patient_id>", methods=["PUT"])
    @token_required
    def update_profile(patient_id):

        data = request.get_json() or {}

        contact_name       = data.get("contact_name")
        contact_phone      = data.get("contact_phone")
        chronic_conditions = data.get("chronic_conditions")
        blood_group        = data.get("blood_group")
        allergies          = data.get("allergies")
        is_public_visible  = data.get("is_public_visible")

        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE emergency_profile
                    SET
                        contact_name       = %s,
                        contact_phone      = %s,
                        chronic_conditions = %s,
                        blood_group        = %s,
                        allergies          = %s,
                        is_public_visible  = %s
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

            return jsonify({
                "message":    "Emergency profile updated successfully",
                "patient_id": patient_id
            })

        except Exception as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            put_hospital_conn(conn)

    # ── Public QR read (no auth — for emergency responders) ───────────────────
    @app.route("/emergency/public/<patient_id>", methods=["GET"])
    def public_emergency_profile(patient_id):
        """
        No auth required — accessed by scanning a patient's QR code.
        Only returns data when is_public_visible = TRUE.
        """
        conn = get_hospital_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        ep.blood_group,
                        ep.allergies,
                        ep.chronic_conditions,
                        ep.contact_name,
                        ep.contact_phone
                    FROM emergency_profile ep
                    WHERE ep.patient_id      = %s
                      AND ep.is_public_visible = TRUE;
                """, (patient_id,))

                profile = cur.fetchone()

            if not profile:
                return jsonify({
                    "error": "Emergency profile not available or not enabled by patient"
                }), 403

            return jsonify({
                "patient_id":     patient_id,
                "emergency_data": dict(profile)
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            put_hospital_conn(conn)
