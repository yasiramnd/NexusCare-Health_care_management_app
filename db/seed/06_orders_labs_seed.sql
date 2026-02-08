--1. INSERT USERS (Parent Records)
-- Triggers will automatically generate user_id (e.g., NEX000001)
INSERT INTO users (first_name, last_name, contact_no1, contact_no2, address, created_at)
VALUES 
    ('Saman', 'Kumara', '0771111111', NULL, '123 Galle Rd, Colombo', NOW()), -- Patient
    ('Dr. Nimal', 'Perera', '0772222222', '0112222222', '45 Kandy Rd, Kandy', NOW()), -- Doctor
    ('City', 'Pharmacy', '0773333333', NULL, '89 Main St, Galle', NOW()), -- Pharmacy
    ('Super', 'Admin', '0774444444', NULL, 'Nexus HQ, Colombo', NOW()), -- Admin
    ('Asiri', 'Labs', '0775555555', NULL, 'Lab Complex, Colombo', NOW()); -- Lab
    

-- 2. INSERT PROFILES (Linked to Users via Subqueries)

-- A. Insert Patient (Links to Saman)
INSERT INTO patient (user_id, nic, date_of_birth, gender, image_url, QR_code)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'Saman'),
    '200012345678', '2000-01-15', 'Male', 'img_saman.jpg', 'qr_saman.png'
);

-- B. Insert Doctor (Links to Dr. Nimal)
INSERT INTO doctor (user_id, license_no, nic_no, specialization)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'Dr. Nimal'),
    'SLMC-1010', '198012345678', 'Cardiologist'
);

-- C. Insert Pharmacy (Links to City Pharmacy)
INSERT INTO pharmacy (user_id, license_no)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'City'),
    'PHM-555'
);

-- D. Insert Admin (Links to Super Admin)
INSERT INTO admin (user_id, access_level)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'Super'),
    'SuperAdmin'
);

-- E. Insert Lab (Links to Asiri Labs)
INSERT INTO lab (user_id, license_no)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'Asiri'),
    'LAB-999'
);


-- 3. INSERT EMERGENCY PROFILE (For Patient Saman)
INSERT INTO emergency_profile (patient_id, contact_name, contact_phone, chronic_conditions, blood_group, allergies, is_public_visible)
VALUES (
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    'Mrs. Kumara (Wife)', '0711111111', 'None', 'O+', 'Penicillin', TRUE
);


-- 4. INSERT CLINIC & SCHEDULING

-- A. Clinic (Linked to Doctor)
INSERT INTO clinic (user_id, doctor_id, clinic_location, has_clinic_management)
VALUES (
    (SELECT user_id FROM users WHERE first_name = 'Dr. Nimal'), -- User ID of doctor
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    'Sunrise Medical Center, Colombo 03',
    TRUE
);

-- B. Availability
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
VALUES (
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    (SELECT clinic_id FROM clinic WHERE clinic_location LIKE 'Sunrise%'),
    CURRENT_DATE + 1, -- Tomorrow
    '09:00:00',
    TRUE
);

-- C. Appointment (Saman books Dr. Nimal)
INSERT INTO appointment (patient_id, doctor_id, clinic_id, appointment_date, appointment_time, status, is_paid)
VALUES (
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    (SELECT clinic_id FROM clinic WHERE clinic_location LIKE 'Sunrise%'),
    CURRENT_DATE + 1,
    '09:15:00',
    'Waiting', -- Matches your CHECK constraint
    FALSE
);


-- 5. INSERT MEDICAL RECORDS & PRESCRIPTIONS

-- A. Medical Record (Dr. Nimal treats Saman)
INSERT INTO medical_record (patient_id, doctor_id, diagnosis, notes, visit_date)
VALUES (
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    'Viral Fever',
    'Patient has high temp (39C). Advised rest.',
    CURRENT_DATE
);

-- B. Prescription (For the Record above)
-- Note: We assume only one record exists for simplicity in this seed. 
-- In real app, you'd pass the specific ID.
INSERT INTO prescription (record_id, medicine_name, dosage, frequency, duration_days, status)
VALUES (
    (SELECT record_id FROM medical_record LIMIT 1), -- Gets the record we just made
    'Paracetamol',
    '500mg',
    'Three times a day',
    3,
    'Issued'
);


-- 6. INSERT ORDERS (Saman orders from City Pharmacy)
INSERT INTO priority_order (patient_id, prescription_id, pharmacy_id, total_price, collecting_time)
VALUES (
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT prescription_id FROM prescription LIMIT 1),
    (SELECT pharmacy_id FROM pharmacy WHERE license_no = 'PHM-555'),
    1500,
    '2 hours'
);

RAISE NOTICE 'Seed data inserted successfully!';
