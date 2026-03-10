import warnings
import os
import uuid
from werkzeug.utils import secure_filename
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from src.utils.db import get_conn
from src.auth_service.auth.routes import auth_bp, admin_bp
from src.routes.appointment import appointment_bp
from src.routes.qr import doctor_bp
from src.routes.doctor import doctor_portal_bp

# Initialise Firebase (requires FIREBASE_KEY_PATH in .env)
try:
    from src.auth_service.firebase.firebase_init import init_firebase
    init_firebase()
except FileNotFoundError as _fe:
    warnings.warn(f"[Firebase] {_fe}", stacklevel=1)

app = Flask(__name__)
app.url_map.strict_slashes = False

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__name__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app, origins=[
    "http://localhost:5173", "http://127.0.0.1:5173",   # doctor portal
    "http://localhost:5174", "http://127.0.0.1:5174",   # pharmacy portal
    "http://localhost:5175", "http://127.0.0.1:5175",   # lab portal
], supports_credentials=True)


app.register_blueprint(appointment_bp, url_prefix="/api")
app.register_blueprint(doctor_bp, url_prefix="/api")
app.register_blueprint(doctor_portal_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(admin_bp, url_prefix="/admin")

@app.route("/")
def home():
    return {"service": "nexuscare-backend", "status": "ok"}

@app.route("/health")
def health():
    try:
        conn = get_conn()
        conn.close()
        return jsonify({"status": "OK", "message": "Database connected."})
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500

@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        # Add a unique identifier to prevent overwriting
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        # Return the URL
        url = f"http://localhost:5000/uploads/{unique_filename}"
        return jsonify({"url": url, "filename": filename})


if __name__ == "__main__":
    app.run(debug=True)