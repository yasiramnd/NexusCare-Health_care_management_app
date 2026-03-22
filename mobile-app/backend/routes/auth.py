from flask import request, jsonify
from firebase_admin import auth
from db import get_db


def register_user(app):

    @app.route("/auth/register", methods=["POST"])
    def register():

        try:
            data = request.json
            id_token = data.get("idToken")

            decoded_token = auth.verify_id_token(id_token)

            firebase_uid = decoded_token["uid"]
            email = decoded_token.get("email")

            conn = get_db()
            cur = conn.cursor()

            # check if user already exists
            cur.execute("""
                SELECT user_id FROM users
                WHERE firebase_uid = %s;
            """, (firebase_uid,))

            user = cur.fetchone()

            if user:
                return jsonify({
                    "message": "User already registered",
                    "user_id": user["user_id"]
                })


            cur.execute("""
                INSERT INTO users (
                    firebase_uid,
                    email
                )
                VALUES (%s, %s)
                RETURNING user_id;
            """, (firebase_uid, email))

            user_id = cur.fetchone()["user_id"]

            conn.commit()

            cur.close()
            conn.close()

            return jsonify({
                "message": "User registered successfully",
                "user_id": user_id
            })


        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
def login_user(app):

    @app.route("/auth/login", methods=["POST"])
    def login():

        try:
            data = request.json
            id_token = data.get("idToken")

            decoded_token = auth.verify_id_token(id_token)

            return jsonify({
                "message": "Login successful",
                "firebase_uid": decoded_token["uid"],
                "email": decoded_token.get("email")
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 401