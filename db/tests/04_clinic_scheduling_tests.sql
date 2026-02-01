-- 1) View clinics
SELECT * FROM clinic ORDER BY clinic_location;

-- 2) View availability (with doctor info)
SELECT
  a.availability_id,
  a.available_date,
  a.available_time,
  a.is_available,
  a.doctor_id,
  sb.organization
FROM availability a
JOIN staff_base sb ON sb.user_id = a.doctor_id
ORDER BY a.available_date, a.available_time;

-- 3) Ensure availability doctor_id belongs to doctors table
-- Expected: 0 rows
SELECT a.availability_id, a.doctor_id
FROM availability a
LEFT JOIN doctors d ON d.user_id = a.doctor_id
WHERE d.user_id IS NULL;

-- 4) View appointments (with patient + doctor + clinic)
SELECT
  ap.appointment_id,
  ap.appointment_date,
  ap.appointment_time,
  ap.status,
  ap.is_paid,
  ap.patient_id,
  ap.doctor_id,
  c.clinic_location
FROM appointment ap
JOIN clinic c ON c.clinic_id = ap.clinic_id
ORDER BY ap.appointment_date, ap.appointment_time;

-- 5) Ensure appointment doctor_id belongs to doctors
-- Expected: 0 rows
SELECT ap.appointment_id, ap.doctor_id
FROM appointment ap
LEFT JOIN doctors d ON d.user_id = ap.doctor_id
WHERE d.user_id IS NULL;

-- 6) Ensure appointment patient_id exists
-- Expected: 0 rows
SELECT ap.appointment_id, ap.patient_id
FROM appointment ap
LEFT JOIN patients p ON p.patient_id = ap.patient_id
WHERE p.patient_id IS NULL;

-- 7) Detect double-booking for doctors (should be none)
-- Expected: 0 rows
SELECT doctor_id, appointment_date, appointment_time, COUNT(*) AS cnt
FROM appointment
GROUP BY doctor_id, appointment_date, appointment_time
HAVING COUNT(*) > 1;

-- 8) Detect double-booking for patients (should be none)
-- Expected: 0 rows
SELECT patient_id, appointment_date, appointment_time, COUNT(*) AS cnt
FROM appointment
GROUP BY patient_id, appointment_date, appointment_time
HAVING COUNT(*) > 1;

-- 9) Check that booked slot is unavailable (if you ran the UPDATE in seed)
SELECT
  a.doctor_id,
  a.available_date,
  a.available_time,
  a.is_available
FROM availability a
WHERE a.available_date = (CURRENT_DATE + INTERVAL '1 day')::date
ORDER BY a.available_time;