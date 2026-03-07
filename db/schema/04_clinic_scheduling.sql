-- Clinic & Scheduling Tables

CREATE SEQUENCE clinic_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS clinic (
  clinic_id VARCHAR(12) PRIMARY KEY,
  user_id VARCHAR(12),
  doctor_id VARCHAR(12),
  clinic_location VARCHAR(150) NOT NULL,
  has_clinic_management BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_id FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability (
  doctor_id VARCHAR(12),
  clinic_id VARCHAR(12),
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,

  PRIMARY KEY (doctor_id, clinic_id), -- Fixed: Added comma

  CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_availability_clinic FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);

CREATE SEQUENCE appointment_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS appointment (
  appointment_id VARCHAR(12) PRIMARY KEY,
  patient_id VARCHAR(12),
  doctor_id VARCHAR(12),
  clinic_id VARCHAR(12),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Ongoing', 'Conducted','Not Conducted')),
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_clinic FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE
);