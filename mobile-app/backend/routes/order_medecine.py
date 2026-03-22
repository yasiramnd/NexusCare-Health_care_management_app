from flask import jsonify, request
from db import get_db

def order_medicine(app):

    @app.route("/prescription/order", methods=["POST"])
    def create_order():

        try:
            data = request.get_json()

            # ==========================
            # Extract parameters
            # ==========================
            order_type = data.get("order_type")
            patient_id = data.get("patient_id")
            prescription_id = data.get("prescription_id")
            pharmacy_id = data.get("pharmacy_id")
            collecting_time = data.get("collecting_time")

            # ==========================
            # Validate input
            # ==========================
            if not all([order_type, patient_id, prescription_id, pharmacy_id]):
                return jsonify({"error": "Missing required fields"}), 400

            conn = get_db()
            cur = conn.cursor()

            # ==========================
            # NORMAL ORDER
            # ==========================
            if order_type == "normal":

                cur.execute("""
                    INSERT INTO normal_order (
                        patient_id,
                        prescription_id,
                        pharmacy_id,
                        is_prepared
                    )
                    VALUES (%s, %s, %s, FALSE)
                    RETURNING order_id;
                """, (patient_id, prescription_id, pharmacy_id))


            # ==========================
            # PRIORITY ORDER
            # ==========================
            elif order_type == "priority":

                if not collecting_time:
                    return jsonify({"error": "collecting_time required for priority order"}), 400

                cur.execute("""
                    INSERT INTO priority_order (
                        patient_id,
                        prescription_id,
                        pharmacy_id,
                        collecting_time
                    )
                    VALUES (%s, %s, %s, %s)
                    RETURNING order_id;
                """, (patient_id, prescription_id, pharmacy_id, collecting_time))


            else:
                return jsonify({"error": "Invalid order type"}), 400


            order_id = cur.fetchone()["order_id"]

            conn.commit()

            cur.close()
            conn.close()

            return jsonify({
                "message": f"{order_type.capitalize()} order placed successfully",
                "order_id": order_id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500