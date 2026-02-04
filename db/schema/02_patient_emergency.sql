CREATE SEQUENCE IF NOT EXISTS patient_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS patients (
  patient_id VARCHAR(10) PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  nic VARCHAR(20) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10),
  image_url VARCHAR(2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_patient_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_id IS NULL OR NEW.patient_id = '' THEN
    NEW.patient_id := 'PT' || LPAD(nextval('patient_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_patient_id ON patients;
CREATE TRIGGER trg_generate_patient_id
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION generate_patient_id();

CREATE TABLE IF NOT EXISTS emergency_profile (
  patient_id VARCHAR(10) PRIMARY KEY,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  chronic_conditions TEXT,
  blood_group VARCHAR(5),
  allergies TEXT,
  is_public_visible BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_emergency_patient
    FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patient_user ON patients(user_id);
