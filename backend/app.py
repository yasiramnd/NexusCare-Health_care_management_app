from flask import Flask, jsonify
from flask_cors import CORS
from src.utils.db import get_conn

from src.routes.appointment import appointment_bp
from src.routes.qr import doctor_bp
app = Flask(__name__)       
CORS(app)


app.register_blueprint(appointment_bp, url_prefix="/api")
app.register_blueprint(doctor_bp, url_prefix="/api")

@app.route("/health")
def health():
    try:
        conn = get_conn()
        conn.close()
        return jsonify({"status": "OK", "message": "Database connected."})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)