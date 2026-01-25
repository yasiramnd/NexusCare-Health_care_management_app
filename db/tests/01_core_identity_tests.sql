
-- 1) Get role of a user (by email)
SELECT
  u.first_name,
  u.last_name,
  c.email,
  c.role
FROM credentials c
JOIN users u ON u.user_id = c.user_id
WHERE c.email = 'doctor1@nexuscare.com';

-- 2) List all doctors
SELECT
  u.first_name,
  u.last_name,
  c.email,
  u.contact_no1
FROM credentials c
JOIN users u ON u.user_id = c.user_id
WHERE c.role = 'DOCTOR'
ORDER BY u.first_name, u.last_name;

-- 3) Find user by Firebase UID (what Flask will use)
SELECT
  c.firebase_uid,
  c.user_name,
  c.email,
  c.role
FROM credentials c
WHERE c.firebase_uid = 'firebase_uid_pat';

