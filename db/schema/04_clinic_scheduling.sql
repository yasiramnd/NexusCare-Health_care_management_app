-- 1) Clinic table
CREATE TABLE IF NOT EXISTS clinic (
  clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_location VARCHAR(150) NOT NULL,
  has_clinic_management BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2) Availability table
CREATE TABLE IF NOT EXISTS availability (
  availability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,

  CONSTRAINT fk_availability_doctor
    FOREIGN KEY (doctor_id)
    REFERENCES staff(user_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_availability_clinic
    FOREIGN KEY (clinic_id)
    REFERENCES clinic(clinic_id)
    ON DELETE CASCADE,

  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, clinic_id, available_date, available_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_doctor_date
  ON availability (doctor_id, available_date);

CREATE INDEX IF NOT EXISTS idx_availability_clinic_date
  ON availability (clinic_id, available_date);

-- 3) Appointment table
CREATE TABLE IF NOT EXISTS appointment (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(10) NOT NULL,
  doctor_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'BOOKED',
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_appointment_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,

  CONSTRAINT fk_appointment_doctor
    FOREIGN KEY (doctor_id) REFERENCES staff(user_id) ON DELETE CASCADE,

  CONSTRAINT fk_appointment_clinic
    FOREIGN KEY (clinic_id) REFERENCES clinic(clinic_id) ON DELETE CASCADE,

  -- prevent double booking (recommended)
  CONSTRAINT uq_doctor_booking UNIQUE (doctor_id, appointment_date, appointment_time),
  CONSTRAINT uq_patient_booking UNIQUE (patient_id, appointment_date, appointment_time)
);

CREATE INDEX IF NOT EXISTS idx_appointment_doctor_date
  ON appointment (doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointment_patient_date
  ON appointment (patient_id, appointment_date);
