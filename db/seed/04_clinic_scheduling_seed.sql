-- 1) Create a clinic
INSERT INTO clinic (clinic_location, has_clinic_management)
VALUES ('Colombo General Clinic', TRUE)
ON CONFLICT DO NOTHING;

-- 2) Add availability slots for the doctor (pick the first seeded doctor)
-- We join staff_base -> doctors to guarantee it is a doctor
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
  d.user_id,
  c.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  TIME '10:00',
  TRUE
FROM clinic c
JOIN doctors d ON TRUE
WHERE c.clinic_location = 'Colombo General Clinic'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
  d.user_id,
  c.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  TIME '11:00',
  TRUE
FROM clinic c
JOIN doctors d ON TRUE
WHERE c.clinic_location = 'Colombo General Clinic'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 3) Book 1 appointment for the first patient with the same doctor at 10:00
INSERT INTO appointment (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, status, is_paid)
SELECT
  p.patient_id,
  d.user_id,
  c.clinic_id,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  TIME '10:00',
  'BOOKED',
  FALSE
FROM clinic c
JOIN doctors d ON TRUE
JOIN patients p ON TRUE
WHERE c.clinic_location = 'Colombo General Clinic'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4) Mark that availability slot unavailable after booking (optional)
UPDATE availability a
SET is_available = FALSE
FROM clinic c
JOIN doctors d ON TRUE
WHERE a.doctor_id = d.user_id
  AND a.clinic_id = c.clinic_id
  AND c.clinic_location = 'Colombo General Clinic'
  AND a.available_date = (CURRENT_DATE + INTERVAL '1 day')::date
  AND a.available_time = TIME '10:00';