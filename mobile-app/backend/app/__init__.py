from flask import Flask
from flask_cors import CORS
from routes.patient_register import patient_register_bp
from routes.patient_profile  import patient_profile_bp

from app.firebase.firebase_init import init_firebase
from app.auth.routes import auth_bp, admin_bp

from routes.availability        import get_available_times
from routes.appointments        import book_appointment
from routes.medical_records     import get_medical_records
from routes.prescriptions       import get_prescriptions
from routes.lab_reports         import get_lab_reports
from routes.emergency           import update_emergency_profile
from routes.emergency_visibility import update_emergency_visibility
from routes.order_medecine      import order_medicine


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Root route for health check or landing
    @app.route("/")
    def root():
        return {"message": "Backend is running!"}

    # Initialise Firebase Admin SDK (singleton — safe to call multiple times)
    init_firebase()

    # ── Auth & admin routes (blueprint) ──────────────────────────────────────
    # /auth/register      POST  — register new user (no token needed)
    # /auth/me            GET   — get current user id + role
    # /auth/protected     GET   — generic test route
    # /admin/dashboard    GET   — ADMIN only
    # /admin/pending-users GET  — ADMIN only
    # /admin/approve/:id  PATCH — ADMIN only
    app.register_blueprint(auth_bp,  url_prefix="/auth")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(patient_register_bp)
    app.register_blueprint(patient_profile_bp)

    # ── Clinical routes (all protected by @token_required inside each file) ──
    # /doctor/available-times/<doctor_id>/<date>           GET
    # /appointment/book/<patient_id>/<doctor_id>/<date>/<time>  POST
    # /patient/medical-records/<patient_id>                GET
    # /patient/prescriptions/<patient_id>                  GET
    # /patient/lab-reports/<patient_id>                    GET
    # /patient/emergency-profile/update/<patient_id>       PUT
    # /patient/emergency-profile/visibility/<patient_id>   PUT
    # /emergency/public/<patient_id>                       GET  (no auth — QR scan)
    # /patient/order/<type>/<patient_id>/<rx_id>/<pharm_id> POST
    get_available_times(app)
    book_appointment(app)
    get_medical_records(app)
    get_prescriptions(app)
    get_lab_reports(app)
    update_emergency_profile(app)
    update_emergency_visibility(app)
    order_medicine(app)

    return app
