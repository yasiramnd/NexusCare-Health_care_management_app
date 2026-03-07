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
    """Liveness probe – always returns 200 if the process is up."""
    return jsonify({"status": "OK", "message": "Service is running."}), 200


@app.route("/health/db")
def health_db():
    """Readiness probe – checks live database connectivity."""
    try:
        conn = get_conn()
        conn.close()
        return jsonify({"status": "OK", "message": "Database connected."}), 200
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)