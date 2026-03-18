from flask import Flask
from flask_cors import CORS

import firebase_config

from routes.availability import get_available_times
from routes.appointments import book_appointment
from routes.medical_records import get_medical_records
from routes.prescriptions import get_prescriptions
from routes.lab_reports import get_lab_reports,get_requested_lab_reports
from routes.emergency import update_emergency_profile
from routes.emergency_visibility import update_emergency_visibility
from routes.order_medecine import order_medicine
from routes.auth import register_user, login_user



app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return {"message": "NexusCare Backend Running"}

# Register routes
get_available_times(app)
book_appointment(app)
get_medical_records(app)
get_prescriptions(app)
get_lab_reports(app)
get_requested_lab_reports(app)
update_emergency_profile(app)
update_emergency_visibility(app)
order_medicine(app)
register_user(app)
login_user(app)


if __name__ == "__main__":
    app.run(debug=True)