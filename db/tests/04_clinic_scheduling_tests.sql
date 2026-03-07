-- Member 4: Test Queries (Scheduling Module)

-- Basic sanity checks (fail fast if seed didn't insert anything)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clinic) THEN
    RAISE EXCEPTION 'TEST FAIL: clinic table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM availability) THEN
    RAISE EXCEPTION 'TEST FAIL: availability table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM appointment) THEN
    RAISE EXCEPTION 'TEST FAIL: appointment table is empty';
  END IF;
END $$;

-- ---------------------------------------------------------
-- Test 1: “available slots for doctor”
-- (uses the first doctor in the doctor table to avoid hardcoding)
-- ---------------------------------------------------------
SELECT
  a.doctor_id,
  a.available_date,
  a.available_time,
  a.is_available,
  c.clinic_id,
  c.clinic_location
FROM availability a
JOIN clinic c ON c.clinic_id = a.clinic_id
WHERE a.doctor_id = (SELECT doctor_id FROM doctor ORDER BY doctor_id LIMIT 1)
ORDER BY a.available_date, a.available_time;

-- ---------------------------------------------------------
-- Test 2: “appointments for patient”
-- (uses the first patient in the patient table to avoid hardcoding)
-- ---------------------------------------------------------
SELECT
  ap.appointment_id,
  ap.patient_id,
  ap.doctor_id,
  ap.clinic_id,
  ap.appointment_date,
  ap.appointment_time,
  ap.status,
  ap.is_paid,
  c.clinic_location
FROM appointment ap
JOIN clinic c ON c.clinic_id = ap.clinic_id
WHERE ap.patient_id = (SELECT patient_id FROM patient ORDER BY patient_id LIMIT 1)
ORDER BY ap.appointment_date DESC, ap.appointment_time DESC;

-- ---------------------------------------------------------
-- Test 3: “last 5 appointments”
-- (extra helpful query)
-- ---------------------------------------------------------
SELECT
  appointment_id,
  patient_id,
  doctor_id,
  clinic_id,
  appointment_date,
  appointment_time,
  status
FROM appointment
ORDER BY appointment_date DESC, appointment_time DESC
LIMIT 5;
