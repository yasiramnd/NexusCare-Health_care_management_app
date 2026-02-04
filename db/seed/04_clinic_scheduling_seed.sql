INSERT INTO clinic (clinic_location, has_clinic_management)
VALUES ('Colombo General Clinic', TRUE)
ON CONFLICT DO NOTHING;

-- availability slots for doctor1
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT d.user_id, c.clinic_id, (CURRENT_DATE + 1), TIME '10:00', TRUE
FROM clinic c
JOIN users u ON u.first_name='John' AND u.last_name='Doctor'
JOIN doctors d ON d.user_id = u.user_id
WHERE c.clinic_location='Colombo General Clinic'
ON CONFLICT DO NOTHING;

INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
SELECT d.user_id, c.clinic_id, (CURRENT_DATE + 1), TIME '11:00', TRUE
FROM clinic c
JOIN users u ON u.first_name='John' AND u.last_name='Doctor'
JOIN doctors d ON d.user_id = u.user_id
WHERE c.clinic_location='Colombo General Clinic'
ON CONFLICT DO NOTHING;

-- book appointment (10:00)
INSERT INTO appointment (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, status, is_paid)
SELECT p.patient_id, d.user_id, c.clinic_id, (CURRENT_DATE + 1), TIME '10:00', 'BOOKED', FALSE
FROM clinic c
JOIN users du ON du.first_name='John' AND du.last_name='Doctor'
JOIN doctors d ON d.user_id = du.user_id
JOIN users pu ON pu.first_name='Jane' AND pu.last_name='Patient'
JOIN patients p ON p.user_id = pu.user_id
WHERE c.clinic_location='Colombo General Clinic'
ON CONFLICT DO NOTHING;

-- mark slot unavailable
UPDATE availability a
SET is_available = FALSE
FROM clinic c
JOIN users du ON du.first_name='John' AND du.last_name='Doctor'
JOIN doctors d ON d.user_id = du.user_id
WHERE a.doctor_id = d.user_id
  AND a.clinic_id = c.clinic_id
  AND a.available_date = (CURRENT_DATE + 1)
  AND a.available_time = TIME '10:00'
  AND c.clinic_location='Colombo General Clinic';
