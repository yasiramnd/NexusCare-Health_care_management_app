-- Member 4: Seed Scheduling Data (Clinic + Availability + Appointment)

-- 0) Safety: sequences (schema creates them, this just ensures they exist)
CREATE SEQUENCE IF NOT EXISTS clinic_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS appointment_seq START 1 INCREMENT 1;

-- 1) Pick one doctor + patient + user that already exist (required by FKs)
--    If these tables are empty, seed will insert 0 rows (FK-safe).
WITH picked AS (
  SELECT
    (SELECT doctor_id  FROM doctor  ORDER BY doctor_id  LIMIT 1) AS doctor_id,
    (SELECT patient_id FROM patient ORDER BY patient_id LIMIT 1) AS patient_id,
    (SELECT user_id    FROM users   ORDER BY user_id    LIMIT 1) AS user_id
)
-- 2) Insert TWO clinics (so we can insert TWO availability rows under the PK constraint)
INSERT INTO clinic (clinic_id, user_id, doctor_id, clinic_location, has_clinic_management)
SELECT
  'CL' || LPAD(nextval('clinic_seq')::TEXT, 10, '0') AS clinic_id,
  picked.user_id,
  picked.doctor_id,
  'Colombo General Clinic' AS clinic_location,
  TRUE AS has_clinic_management
FROM picked
WHERE picked.doctor_id IS NOT NULL AND picked.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clinic WHERE clinic_location = 'Colombo General Clinic');

WITH picked AS (
  SELECT
    (SELECT doctor_id  FROM doctor  ORDER BY doctor_id  LIMIT 1) AS doctor_id,
    (SELECT user_id    FROM users   ORDER BY user_id    LIMIT 1) AS user_id
)
INSERT INTO clinic (clinic_id, user_id, doctor_id, clinic_location, has_clinic_management)
SELECT
  'CL' || LPAD(nextval('clinic_seq')::TEXT, 10, '0') AS clinic_id,
  picked.user_id,
  picked.doctor_id,
  'Colombo General Clinic - Branch' AS clinic_location,
  FALSE AS has_clinic_management
FROM picked
WHERE picked.doctor_id IS NOT NULL AND picked.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clinic WHERE clinic_location = 'Colombo General Clinic - Branch');

-- 3) Seed 2 availability rows for the same doctor (one per clinic due to PK)
-- Slot A: Tomorrow 10:00 at main clinic
WITH picked AS (
  SELECT
    (SELECT doctor_id FROM doctor ORDER BY doctor_id LIMIT 1) AS doctor_id,
    (SELECT clinic_id FROM clinic WHERE clinic_location='Colombo General Clinic' LIMIT 1) AS clinic_id
)
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
  picked.doctor_id,
  picked.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::DATE,
  TIME '10:00',
  TRUE
FROM picked
WHERE picked.doctor_id IS NOT NULL AND picked.clinic_id IS NOT NULL
ON CONFLICT (doctor_id, clinic_id) DO NOTHING;

-- Slot B: Tomorrow 11:00 at branch clinic
WITH picked AS (
  SELECT
    (SELECT doctor_id FROM doctor ORDER BY doctor_id LIMIT 1) AS doctor_id,
    (SELECT clinic_id FROM clinic WHERE clinic_location='Colombo General Clinic - Branch' LIMIT 1) AS clinic_id
)
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
  picked.doctor_id,
  picked.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::DATE,
  TIME '11:00',
  TRUE
FROM picked
WHERE picked.doctor_id IS NOT NULL AND picked.clinic_id IS NOT NULL
ON CONFLICT (doctor_id, clinic_id) DO NOTHING;

-- 4) Seed 1 appointment: Patient books 10:00 at main clinic
WITH picked AS (
  SELECT
    (SELECT patient_id FROM patient ORDER BY patient_id LIMIT 1) AS patient_id,
    (SELECT doctor_id  FROM doctor  ORDER BY doctor_id  LIMIT 1) AS doctor_id,
    (SELECT clinic_id  FROM clinic  WHERE clinic_location='Colombo General Clinic' LIMIT 1) AS clinic_id
)
INSERT INTO appointment (
  appointment_id,
  patient_id,
  doctor_id,
  clinic_id,
  appointment_date,
  appointment_time,
  status,
  is_paid
)
SELECT
  'AP' || LPAD(nextval('appointment_seq')::TEXT, 10, '0') AS appointment_id,
  picked.patient_id,
  picked.doctor_id,
  picked.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::DATE,
  TIME '10:00',
  'Waiting',
  FALSE
FROM picked
WHERE picked.patient_id IS NOT NULL AND picked.doctor_id IS NOT NULL AND picked.clinic_id IS NOT NULL
ON CONFLICT (appointment_id) DO NOTHING;

-- 5) Optional: mark the main-clinic availability row as unavailable after booking
UPDATE availability a
SET is_available = FALSE
WHERE a.doctor_id = (SELECT doctor_id FROM doctor ORDER BY doctor_id LIMIT 1)
  AND a.clinic_id = (SELECT clinic_id FROM clinic WHERE clinic_location='Colombo General Clinic' LIMIT 1);
