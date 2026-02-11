-- User & Staff Triggers
--userID
CREATE TRIGGER trg_generate_user_id BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION generate_user_id();
--doctorID
CREATE TRIGGER trg_generate_doctor_id BEFORE INSERT ON doctor FOR EACH ROW EXECUTE FUNCTION generate_doctor_id();
--pharmacyID
CREATE TRIGGER trg_generate_pharmacy_id BEFORE INSERT ON pharmacy FOR EACH ROW EXECUTE FUNCTION generate_pharmacy_id();
--labID
CREATE TRIGGER trg_generate_lab_id BEFORE INSERT ON lab FOR EACH ROW EXECUTE FUNCTION generate_lab_id();

-- Patient & Admin Triggers
--patientID
CREATE TRIGGER trg_generate_patient_id BEFORE INSERT ON patient FOR EACH ROW EXECUTE FUNCTION generate_patient_id();
--adminID
CREATE TRIGGER trg_generate_admin_id BEFORE INSERT ON admin FOR EACH ROW EXECUTE FUNCTION generate_admin_id();

-- Operations Triggers
--clinicID
CREATE TRIGGER trg_generate_clinic_id BEFORE INSERT ON clinic FOR EACH ROW EXECUTE FUNCTION generate_clinic_id();
--appointmentID
CREATE TRIGGER trg_generate_appointment_id BEFORE INSERT ON appointment FOR EACH ROW EXECUTE FUNCTION generate_appointment_id();
--medicalRecID
CREATE TRIGGER trg_generate_medical_rec BEFORE INSERT ON medical_record FOR EACH ROW EXECUTE FUNCTION generate_medical_rec();
--prescriptionID
CREATE TRIGGER trg_generate_prescription_id BEFORE INSERT ON prescription FOR EACH ROW EXECUTE FUNCTION generate_prescription_id();

-- Orders Triggers
--POrderID
CREATE TRIGGER trg_generate_P_order_id BEFORE INSERT ON priority_order FOR EACH ROW EXECUTE FUNCTION generate_p_order_id();
--NOrderID
CREATE TRIGGER trg_generate_n_order_id BEFORE INSERT ON normal_order FOR EACH ROW EXECUTE FUNCTION generate_n_order_id();
--labReportID
CREATE TRIGGER trg_generate_lab_report_id BEFORE INSERT ON lab_reports FOR EACH ROW EXECUTE FUNCTION generate_lab_report_id();