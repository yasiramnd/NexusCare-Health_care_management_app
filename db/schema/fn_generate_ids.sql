CREATE OR REPLACE FUNCTION generate_user_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := 'NEX' || LPAD(nextval('user_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_doctor_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.doctor_id := 'DOC' || LPAD(nextval('doctor_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_pharmacy_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.pharmacy_id := 'PAH' || LPAD(nextval('pharmacy_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_lab_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.lab_id := 'LAB' || LPAD(nextval('lab_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_patient_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.patient_id := 'PT' || LPAD(nextval('patient_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_admin_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.admin_id := 'AD' || LPAD(nextval('admin_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_clinic_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.clinic_id := 'CLI' || LPAD(nextval('clinic_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_appointment_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.appointment_id := 'APP' || LPAD(nextval('appointment_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_medical_rec() RETURNS TRIGGER AS $$
BEGIN
    NEW.record_id := 'MDREC' || LPAD(nextval('medical_rec_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_prescription_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.prescription_id := 'PREC' || LPAD(nextval('prescription_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_p_order_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.order_id := 'PORD' || LPAD(nextval('p_order_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_n_order_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.order_id := 'NORD' || LPAD(nextval('n_order_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_lab_report_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.lab_report_id := 'LBRE' || LPAD(nextval('lab_report_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;