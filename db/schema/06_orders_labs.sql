-- Orders & Lab Reports

CREATE SEQUENCE p_order_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS priority_order (
    order_id VARCHAR(12) PRIMARY KEY,
    patient_id VARCHAR(12),
    prescription_id VARCHAR(12),
    pharmacy_id VARCHAR(12),
    total_price INT NOT NULL,
    collecting_time TIME NOT NULL,
    additional_charge NUMERIC(10,2) DEFAULT 0,

    CONSTRAINT fk_patient_id FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_id FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_pharmacy_id FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(pharmacy_id) ON DELETE CASCADE
);

CREATE SEQUENCE n_order_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS normal_order (
    order_id VARCHAR(12) PRIMARY KEY,
    patient_id VARCHAR(12),
    prescription_id VARCHAR(12),
    pharmacy_id VARCHAR(12),
    total_price INT NOT NULL,
    is_prepared BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_n_patient_id FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_n_prescription_id FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_n_pharmacy_id FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(pharmacy_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommended_reports (
    medical_record_id VARCHAR(12),
    lab_id VARCHAR(12),
    test_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (medical_record_id, lab_id),

    CONSTRAINT fk_recommended_record FOREIGN KEY (medical_record_id) REFERENCES medical_record(record_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommended_lab FOREIGN KEY (lab_id) REFERENCES lab(lab_id) ON DELETE CASCADE
);

CREATE SEQUENCE lab_report_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS lab_reports (
    lab_report_id VARCHAR(12) PRIMARY KEY,
    patient_id VARCHAR(12),
    doctor_id VARCHAR(12),
    lab_id VARCHAR(12),
    test_name VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_lab_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    CONSTRAINT fk_lab_staff FOREIGN KEY (lab_id) REFERENCES lab(lab_id) ON DELETE CASCADE
);