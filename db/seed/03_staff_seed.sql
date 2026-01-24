-- Option A seeds: insert staff profiles by matching users.email
-- Update emails to match Member 1's seed_01.sql

INSERT INTO staff (user_id, registration_no, organization)
SELECT id, 'DOC-SL-0001', 'National Hospital Colombo'
FROM users WHERE email = 'doctor1@nexuscare.lk'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO staff (user_id, registration_no, organization)
SELECT id, 'PHAR-SL-0101', 'Union Pharmacy'
FROM users WHERE email = 'pharmacy1@nexuscare.lk'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO staff (user_id, registration_no, organization)
SELECT id, 'LAB-SL-0201', 'Lanka Diagnostic Center'
FROM users WHERE email = 'lab1@nexuscare.lk'
ON CONFLICT (user_id) DO NOTHING;
