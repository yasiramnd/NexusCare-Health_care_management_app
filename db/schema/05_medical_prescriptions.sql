-- Medical records table
CREATE TABLE IF NOT EXISTS medical_record (
    record_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    diagnosis TEXT NOT NULL,
    notes TEXT,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_record_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_record_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(doctor_id)
        ON DELETE CASCADE
);
-- Medical records table
CREATE TABLE IF NOT EXISTS medical_record (
  record_id SERIAL PRIMARY KEY,
  patient_id VARCHAR(10) NOT NULL,
  doctor_id UUID NOT NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  visit_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_record_patient
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_record_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES staff(user_id)
    ON DELETE CASCADE
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescription (
  prescription_id SERIAL PRIMARY KEY,
  record_id INT NOT NULL,
  patient_id VARCHAR(10) NOT NULL,
  doctor_id UUID NOT NULL,
  medicine_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(50),
  duration_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_presc_record
    FOREIGN KEY (record_id)
    REFERENCES medical_record(record_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_presc_patient
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_presc_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES staff(user_id)
    ON DELETE CASCADE
);
-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescription (
    prescription_id SERIAL PRIMARY KEY,
    record_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50),
    duration_days INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_presc_record
        FOREIGN KEY (record_id)
        REFERENCES medical_record(record_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_presc_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_presc_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor(doctor_id)
        ON DELETE CASCADE
);