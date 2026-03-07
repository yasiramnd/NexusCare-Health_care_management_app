-- =============================================
-- SEED DATA FOR NEXUSCARE (Updated for Final Schema)
-- =============================================

-- 1. INSERT USERS (Parent Records)
-- Note: We use 'name' instead of first_name/last_name as per 01_core_identity.sql
INSERT INTO users (name, contact_no1, contact_no2, address, created_at)
VALUES 
    ('Saman Kumara', '0771111111', NULL, '123 Galle Rd, Colombo', NOW()),      -- Patient
    ('Dr. Nimal Perera', '0772222222', '0112222222', '45 Kandy Rd, Kandy', NOW()), -- Doctor
    ('City Pharmacy', '0773333333', NULL, '89 Main St, Galle', NOW()),         -- Pharmacy
    ('Super Admin', '0774444444', NULL, 'Nexus HQ, Colombo', NOW()),           -- Admin
    ('Asiri Labs', '0775555555', NULL, 'Lab Complex, Colombo', NOW());         -- Lab


-- 2. INSERT PROFILES (Linked via Subqueries)

-- A. Insert Patient
INSERT INTO patient (patient_id, user_id, nic, date_of_birth, gender, image_url, QR_code)
VALUES (
    DEFAULT, -- Let trigger generate PT...
    (SELECT user_id FROM users WHERE name = 'Saman Kumara'),
    '200012345678', 
    '2000-01-15', 
    'Male', 
    'img_saman.jpg', 
    'qr_saman.png'
);

-- B. Insert Doctor
INSERT INTO doctor (doctor_id, user_id, license_no, nic_no, gender, specialization, image_url, certification_url)
VALUES (
    DEFAULT, -- Let trigger generate DOC...
    (SELECT user_id FROM users WHERE name = 'Dr. Nimal Perera'),
    'SLMC-1010', 
    '198012345678', 
    'Male',
    'Cardiologist',
    'doc_img.jpg',
    'http://docs.com/cert/slmc1010.pdf'
);

-- C. Insert Pharmacy
INSERT INTO pharmacy (pharmacy_id, user_id, pharmacy_license_no, business_registration_number, business_registration_url, available_date, available_time)
VALUES (
    DEFAULT, -- Let trigger generate PAH...
    (SELECT user_id FROM users WHERE name = 'City Pharmacy'),
    'PHM-555',
    'BR-998877',
    'http://docs.com/br/phm555.pdf',
    CURRENT_DATE,
    '08:00:00'
);

-- D. Insert Lab
INSERT INTO lab (lab_id, user_id, license_no, business_registration_number, business_registration_url, available_date, available_time, avilable_tests)
VALUES (
    DEFAULT, -- Let trigger generate LAB...
    (SELECT user_id FROM users WHERE name = 'Asiri Labs'),
    'LAB-999',
    'BR-112233',
    'http://docs.com/br/lab999.pdf',
    CURRENT_DATE,
    '07:30:00',
    'Full Blood Count, Lipid Profile, Dengue Antigen'
);

-- E. Insert Admin
INSERT INTO admin (admin_id, user_id, access_level)
VALUES (
    DEFAULT, -- Let trigger generate AD...
    (SELECT user_id FROM users WHERE name = 'Super Admin'),
    'SuperAdmin'
);


-- 3. EMERGENCY PROFILE
INSERT INTO emergency_profile (patient_id, contact_name, contact_phone, chronic_conditions, blood_group, allergies, is_public_visible)
VALUES (
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    'Mrs. Kumara (Wife)', 
    '0711111111', 
    'None', 
    'O+', 
    'Penicillin', 
    TRUE
);


-- 4. CLINIC & APPOINTMENTS

-- A. Create Clinic
INSERT INTO clinic (clinic_id, user_id, doctor_id, clinic_location, has_clinic_management)
VALUES (
    DEFAULT, -- Let trigger generate CLI...
    (SELECT user_id FROM users WHERE name = 'Dr. Nimal Perera'), -- Owner
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    'Sunrise Medical Center, Colombo 03',
    TRUE
);

-- B. Set Availability
INSERT INTO availability (doctor_id, clinic_id, available_date, available_time, is_available)
VALUES (
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    (SELECT clinic_id FROM clinic WHERE clinic_location LIKE 'Sunrise%'),
    CURRENT_DATE + 1, -- Tomorrow
    '09:00:00',
    TRUE
);

-- C. Book Appointment
INSERT INTO appointment (appointment_id, patient_id, doctor_id, clinic_id, appointment_date, appointment_time, status, is_paid)
VALUES (
    DEFAULT, -- Let trigger generate APP...
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    (SELECT clinic_id FROM clinic WHERE clinic_location LIKE 'Sunrise%'),
    CURRENT_DATE + 1,
    '09:15:00',
    'Waiting', -- Matches CHECK constraint
    FALSE
);


-- 5. MEDICAL RECORDS & PRESCRIPTIONS

-- A. Create Record
INSERT INTO medical_record (record_id, patient_id, doctor_id, diagnosis, notes, visit_date)
VALUES (
    DEFAULT, -- Let trigger generate MDREC...
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT doctor_id FROM doctor WHERE license_no = 'SLMC-1010'),
    'Viral Fever',
    'Patient has high temp (39C). Advised rest.',
    CURRENT_DATE
);

-- B. Create Prescription
INSERT INTO prescription (prescription_id, record_id, medicine_name, dosage, frequency, duration_days, status)
VALUES (
    DEFAULT, -- Let trigger generate PREC...
    (SELECT record_id FROM medical_record LIMIT 1), -- Gets the record we just made
    'Paracetamol',
    '500mg',
    'Three times a day',
    3,
    'Issued'
);


-- 6. ORDERS

INSERT INTO priority_order (order_id, patient_id, prescription_id, pharmacy_id, total_price, collecting_time, additional_charge)
VALUES (
    DEFAULT, -- Let trigger generate PORD...
    (SELECT patient_id FROM patient WHERE nic = '200012345678'),
    (SELECT prescription_id FROM prescription LIMIT 1),
    (SELECT pharmacy_id FROM pharmacy WHERE pharmacy_license_no = 'PHM-555'),
    1500,
    '10:30:00',
    250.00
);
