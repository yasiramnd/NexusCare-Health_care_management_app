-- Member 4: Scheduling Data



-- 1) Create a clinic
INSERT INTO clinic (clinic_location, has_clinic_management)
VALUES ('Colombo General Clinic', TRUE);

-- 2) Add 2 availability slots for doctor1 at the clinic
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
    d.user_id,
    c.clinic_id,
    CURRENT_DATE + INTERVAL '1 day',
    TIME '10:00',
    TRUE
FROM clinic c
JOIN users du ON du.email = 'doctor1@nexuscare.lk'
JOIN staff d ON d.user_id = du.id
WHERE c.clinic_location = 'Colombo General Clinic';

INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT
    d.user_id,
    c.clinic_id,
    CURRENT_DATE + INTERVAL '1 day',
    TIME '11:00',
    TRUE
FROM clinic c
JOIN users du ON du.email = 'doctor1@nexuscare.lk'
JOIN staff d ON d.user_id = du.id
WHERE c.clinic_location = 'Colombo General Clinic';

-- 3) Book 1 appointment for patient1 with doctor1 (using 10:00 slot)
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
JOIN users pu ON pu.email = 'patient1@nexuscare.lk'
JOIN patients p ON p.patient_id = pu.id
JOIN users du ON du.email = 'doctor1@nexuscare.lk'
JOIN staff d ON d.user_id = du.id
WHERE c.clinic_location = 'Colombo General Clinic';

-- Optional: Mark that slot as unavailable after booking
UPDATE availability a
SET is_available = FALSE
FROM clinic c
JOIN users du ON du.email = 'doctor1@nexuscare.lk'
JOIN staff d ON d.user_id = du.id
WHERE a.doctor_id = d.user_id
  AND a.clinic_id = c.clinic_id
  AND a.available_date = (CURRENT_DATE + INTERVAL '1 day')::date
  AND a.available_time = TIME '10:00';

