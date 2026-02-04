-- Common staff info
CREATE TABLE IF NOT EXISTS staff_base (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  license_no VARCHAR(50) NOT NULL UNIQUE,
  organization VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_base_org ON staff_base(organization);

-- Doctors
CREATE TABLE IF NOT EXISTS doctors (
  user_id UUID PRIMARY KEY REFERENCES staff_base(user_id) ON DELETE CASCADE,
  specialization VARCHAR(100),
  consultation_fee NUMERIC(10,2) CHECK (consultation_fee IS NULL OR consultation_fee >= 0),
  slmc_expiry_date DATE
);

-- Pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
  user_id UUID PRIMARY KEY REFERENCES staff_base(user_id) ON DELETE CASCADE,
  pharmacy_license_no VARCHAR(50) NOT NULL UNIQUE,
  pharmacy_name VARCHAR(120),
  is_24_hours BOOLEAN NOT NULL DEFAULT FALSE
);

-- Labs
CREATE TABLE IF NOT EXISTS labs (
  user_id UUID PRIMARY KEY REFERENCES staff_base(user_id) ON DELETE CASCADE,
  lab_license_no VARCHAR(50) NOT NULL UNIQUE,
  lab_name VARCHAR(120),
  is_24_hours BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_doctors_spec ON doctors(specialization);
