-- sql/patient_registration_migration.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this ONCE in your HOSPITAL DB (Supabase ap-southeast-2)
-- Go to: Supabase Dashboard → SQL Editor → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add missing columns to patient table if they don't exist yet
ALTER TABLE patient
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender        VARCHAR(10),
    ADD COLUMN IF NOT EXISTS phone         VARCHAR(20);

-- 2. Verify the patient table looks correct after running:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'patient'
ORDER BY ordinal_position;

-- Expected columns you should see:
--   patient_id    | character varying | NO
--   date_of_birth | date              | YES
--   gender        | character varying | YES
--   phone         | character varying | YES
--   qr_code       | text              | YES  (already exists from your qr_generator)


-- 3. Verify emergency_profile table exists with correct columns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'emergency_profile'
ORDER BY ordinal_position;

-- Expected columns:
--   patient_id        | character varying
--   blood_group       | character varying
--   allergies         | text
--   chronic_conditions| text
--   contact_name      | text
--   contact_phone     | character varying
--   is_public_visible | boolean

-- If emergency_profile does not exist at all, create it:
CREATE TABLE IF NOT EXISTS emergency_profile (
    patient_id         VARCHAR(12) PRIMARY KEY REFERENCES patient(patient_id),
    blood_group        VARCHAR(5)  DEFAULT 'Unknown',
    allergies          TEXT,
    chronic_conditions TEXT,
    contact_name       TEXT,
    contact_phone      VARCHAR(20),
    is_public_visible  BOOLEAN DEFAULT FALSE
);
