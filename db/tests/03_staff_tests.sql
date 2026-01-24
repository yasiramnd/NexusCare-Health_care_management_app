-- Option A tests

-- 1) List staff by role (requires roles + user_roles)
SELECT
  u.full_name,
  u.email,
  r.role_name,
  s.registration_no,
  s.organization
FROM staff s
JOIN users u ON u.id = s.user_id
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.role_name IN ('DOCTOR', 'PHARMACIST', 'LAB')
ORDER BY r.role_name, u.full_name;

-- 2) Find staff by license/registration number
SELECT
  u.full_name,
  u.email,
  s.registration_no,
  s.organization
FROM staff s
JOIN users u ON u.id = s.user_id
WHERE s.registration_no = 'DOC-SL-0001';
