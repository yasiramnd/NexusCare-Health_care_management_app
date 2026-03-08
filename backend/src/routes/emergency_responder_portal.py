# Flask API with PostgreSQL using environment variables
# Uses connection pool for performance

import os
from flask import Flask, jsonify
from flask_cors import CORS
from psycopg2 import pool
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# -----------------------------------------
# Create PostgreSQL Connection Pool
# -----------------------------------------

connection_pool = pool.SimpleConnectionPool(
    1,
    10,
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_NAME")
)

# -----------------------------------------
# Emergency Profile API
# -----------------------------------------
@app.route("/emergency/<patient_id>")
def get_emergency_profile(patient_id):

    conn = connection_pool.getconn()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
        SELECT u.name,
               u.address,
               p.gender,
               ep.contact_name,
               ep.contact_phone,
               ep.chronic_conditions,
               ep.blood_group,
               ep.allergies,
               ep.is_public_visible
        FROM emergency_profile ep
        JOIN patient p
            ON ep.patient_id = p.patient_id
        JOIN users u 
            ON p.user_id = u.user_id
        WHERE ep.patient_id = %s;
        """,
            (patient_id,)
        )

        record = cursor.fetchone()

        if not record:
            return jsonify({"message": "No record found"})

        if record[8] == False:
            return jsonify({"message": "Profile not public visible"})

        return jsonify({
            "name": record[0],
            "address": record[1],
            "gender": record[2],
            "contact_name": record[3],
            "contact_phone": record[4],
            "chronic_conditions": record[5],
            "blood_group": record[6],
            "allergies": record[7]
        })

    finally:
        cursor.close()
        connection_pool.putconn(conn)


# -----------------------------------------
# Run Application
# -----------------------------------------
if __name__ == "__main__":
    app.run(debug=True)