-- users
INSERT INTO users (first_name, last_name, contact_no1, address) VALUES
('System', 'Admin',   '0700000000', 'NexusCare HQ'),
('John',   'Doctor',  '0711111111', 'Colombo'),
('Jane',   'Patient', '0722222222', 'Kandy'),
('Lanka',  'Lab',     '0733333333', 'Galle'),
('City',   'Pharmacy','0744444444', 'Kurunegala')
ON CONFLICT DO NOTHING;

-- credentials
INSERT INTO credentials (user_id, firebase_uid, user_name, email, role)
SELECT u.user_id, 'firebase_uid_admin', 'admin', 'admin@nexuscare.com', 'ADMIN'
FROM users u WHERE u.first_name='System' AND u.last_name='Admin'
ON CONFLICT DO NOTHING;

INSERT INTO credentials (user_id, firebase_uid, user_name, email, role)
SELECT u.user_id, 'firebase_uid_doc', 'doctor1', 'doctor1@nexuscare.com', 'DOCTOR'
FROM users u WHERE u.first_name='John' AND u.last_name='Doctor'
ON CONFLICT DO NOTHING;

INSERT INTO credentials (user_id, firebase_uid, user_name, email, role)
SELECT u.user_id, 'firebase_uid_pat', 'patient1', 'patient1@nexuscare.com', 'PATIENT'
FROM users u WHERE u.first_name='Jane' AND u.last_name='Patient'
ON CONFLICT DO NOTHING;

INSERT INTO credentials (user_id, firebase_uid, user_name, email, role)
SELECT u.user_id, 'firebase_uid_lab', 'lab1', 'lab1@nexuscare.com', 'LAB'
FROM users u WHERE u.first_name='Lanka' AND u.last_name='Lab'
ON CONFLICT DO NOTHING;

INSERT INTO credentials (user_id, firebase_uid, user_name, email, role)
SELECT u.user_id, 'firebase_uid_pharmacy', 'pharmacy1', 'pharmacy1@nexuscare.com', 'PHARMACY'
FROM users u WHERE u.first_name='City' AND u.last_name='Pharmacy'
ON CONFLICT DO NOTHING;
