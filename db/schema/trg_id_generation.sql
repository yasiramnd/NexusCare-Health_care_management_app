-- User & Staff Triggers
DROP TRIGGER IF EXISTS trg_generate_user_id ON users;
CREATE TRIGGER trg_generate_user_id
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION generate_user_id();

DROP TRIGGER IF EXISTS trg_generate_doctor_id ON doctors;
CREATE TRIGGER trg_generate_doctor_id
BEFORE INSERT ON doctors
FOR EACH ROW EXECUTE FUNCTION generate_doctor_id();

DROP TRIGGER IF EXISTS trg_generate_pharmacy_id ON pharmacies;
CREATE TRIGGER trg_generate_pharmacy_id
BEFORE INSERT ON pharmacies
FOR EACH ROW EXECUTE FUNCTION generate_pharmacy_id();

DROP TRIGGER IF EXISTS trg_generate_lab_id ON labs;
CREATE TRIGGER trg_generate_lab_id
BEFORE INSERT ON labs
FOR EACH ROW EXECUTE FUNCTION generate_lab_id();

-- Patient & Admin Triggers
DROP TRIGGER IF EXISTS trg_generate_patient_id ON patients;
CREATE TRIGGER trg_generate_patient_id
BEFORE INSERT ON patients
FOR EACH ROW EXECUTE FUNCTION generate_patient_id();

DROP TRIGGER IF EXISTS trg_generate_admin_id ON admins;
CREATE TRIGGER trg_generate_admin_id
BEFORE INSERT ON admins
FOR EACH ROW EXECUTE FUNCTION generate_admin_id();

-- Operations Triggers
DROP TRIGGER IF EXISTS trg_generate_clinic_id ON clinics;
CREATE TRIGGER trg_generate_clinic_id
BEFORE INSERT ON clinics
FOR EACH ROW EXECUTE FUNCTION generate_clinic_id();

DROP TRIGGER IF EXISTS trg_generate_appointment_id ON appointment;
CREATE TRIGGER trg_generate_appointment_id
BEFORE INSERT ON appointment
FOR EACH ROW EXECUTE FUNCTION generate_appointment_id();

DROP TRIGGER IF EXISTS trg_generate_medical_rec ON medical_record;
CREATE TRIGGER trg_generate_medical_rec
BEFORE INSERT ON medical_record
FOR EACH ROW EXECUTE FUNCTION generate_medical_rec();

DROP TRIGGER IF EXISTS trg_generate_prescription_id ON prescription;
CREATE TRIGGER trg_generate_prescription_id
BEFORE INSERT ON prescription
FOR EACH ROW EXECUTE FUNCTION generate_prescription_id();

-- Orders Triggers
DROP TRIGGER IF EXISTS trg_generate_P_order_id ON priority_order;
CREATE TRIGGER trg_generate_P_order_id
BEFORE INSERT ON priority_order
FOR EACH ROW EXECUTE FUNCTION generate_p_order_id();

DROP TRIGGER IF EXISTS trg_generate_n_order_id ON normal_order;
CREATE TRIGGER trg_generate_n_order_id
BEFORE INSERT ON normal_order
FOR EACH ROW EXECUTE FUNCTION generate_n_order_id();

-- Lab & Payment Triggers
DROP TRIGGER IF EXISTS trg_generate_lab_report_id ON lab_reports;
CREATE TRIGGER trg_generate_lab_report_id
BEFORE INSERT ON lab_reports
FOR EACH ROW EXECUTE FUNCTION generate_lab_report_id();

DROP TRIGGER IF EXISTS trg_generate_payment_id ON payments;
CREATE TRIGGER trg_generate_payment_id
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION generate_payment_id();
