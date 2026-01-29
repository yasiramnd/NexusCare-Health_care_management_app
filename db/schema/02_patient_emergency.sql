-- Create sequence for patient numbers
CREATE SEQUENCE IF NOT EXISTS patient_seq
START 1
INCREMENT 1;

-- Create patients table
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

-- Create trigger function
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.patient_id :=
        'PT' || LPAD(nextval('patient_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (avoid error if already exists)
DROP TRIGGER IF EXISTS trg_generate_patient_id ON patients;

CREATE TRIGGER trg_generate_patient_id
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION generate_patient_id();

-- Create emergency_profile table
CREATE TABLE IF NOT EXISTS emergency_profile (
    patient_id VARCHAR(10) PRIMARY KEY,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    chronic_conditions TEXT,                 -- fixed typo
    blood_group VARCHAR(5),
    allergies TEXT,
    is_public_visible BOOLEAN NOT NULL DEFAULT FALSE,  -- safer default

    CONSTRAINT fk_emergency_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE
);
