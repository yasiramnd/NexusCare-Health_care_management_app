-- Medical Records & Prescriptions

CREATE SEQUENCE medical_rec_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS medical_record (
  record_id VARCHAR(12) PRIMARY KEY,
  patient_id VARCHAR(12),
  doctor_id VARCHAR(12),
  diagnosis TEXT NOT NULL,
  notes TEXT,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE
);

CREATE SEQUENCE prescription_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS prescription (
  prescription_id VARCHAR(12) PRIMARY KEY,
  record_id VARCHAR(12),
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50),
  duration_days INT CHECK (duration_days IS NULL OR duration_days > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Issued','Ordered','Taken')), -- Fixed Syntax

  CONSTRAINT fk_presc_record FOREIGN KEY (record_id) REFERENCES medical_record(record_id) ON DELETE CASCADE
);