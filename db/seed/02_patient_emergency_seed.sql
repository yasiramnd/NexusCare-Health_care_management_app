-- patient for patient1
INSERT INTO patients (user_id, nic, date_of_birth, gender, image_url)
SELECT u.user_id, '200012345678', '2000-05-10', 'Female', 'https://example.com/patient1.png'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role='PATIENT'
ON CONFLICT (user_id) DO NOTHING;

-- emergency profile
INSERT INTO emergency_profile (patient_id, contact_name, contact_phone, chronic_conditions, blood_group, allergies, is_public_visible)
SELECT p.patient_id, 'Mother', '0771234567', 'Diabetes', 'O+', 'Penicillin', TRUE
FROM patients p
JOIN users u ON u.user_id = p.user_id
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role='PATIENT'
ON CONFLICT (patient_id) DO NOTHING;
