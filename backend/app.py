import os
from flask import Flask, jsonify
from flask_cors import CORS
from src.utils.db import get_conn
from src.auth_service.firebase.firebase_init import init_firebase

from src.routes.appointment import appointment_bp
from src.routes.qr import doctor_bp
from src.auth_service.auth.routes import auth_bp, admin_bp

app = Flask(__name__)

# Allowed frontend origins – extend this list as new portals are deployed.
# CORS_ORIGINS env var can override (comma-separated) for flexibility.
_default_origins = [
    "https://nexuscare-doctor-portal.vercel.app",
    "https://nexuscare-pharmacy-portal.vercel.app",
    # EC2 via nip.io (no custom domain needed)
    "https://13.60.206.154.nip.io",
    # local development
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
_extra = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = _default_origins + _extra

CORS(
    app,
    origins=ALLOWED_ORIGINS,
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)


app.register_blueprint(appointment_bp, url_prefix="/api")
app.register_blueprint(doctor_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(admin_bp, url_prefix="/admin")

# Initialise Firebase Admin SDK if credentials are available.
init_firebase(required=False)

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