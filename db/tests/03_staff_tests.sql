-- 1) View staff_base records
SELECT user_id, license_no, organization, created_at
FROM staff_base
ORDER BY created_at DESC;

-- 2) Ensure every staff_base record has a matching credentials row
-- Expected: 0 rows
SELECT sb.user_id
FROM staff_base sb
LEFT JOIN credentials c ON c.user_id = sb.user_id
WHERE c.user_id IS NULL;

-- 3) Ensure only valid staff roles exist in staff_base
-- Expected: 0 rows
SELECT sb.user_id, c.role
FROM staff_base sb
JOIN credentials c ON c.user_id = sb.user_id
WHERE c.role NOT IN ('DOCTOR','LAB','PHARMACY','RESPONDER','ADMIN');

-- 4) Doctors must be role=DOCTOR
-- Expected: 0 rows
SELECT d.user_id, c.role
FROM doctors d
JOIN credentials c ON c.user_id = d.user_id
WHERE c.role <> 'DOCTOR';

-- 5) Pharmacies must be role=PHARMACY
-- Expected: 0 rows
SELECT p.user_id, c.role
FROM pharmacies p
JOIN credentials c ON c.user_id = p.user_id
WHERE c.role <> 'PHARMACY';

-- 6) Labs must be role=LAB
-- Expected: 0 rows
SELECT l.user_id, c.role
FROM labs l
JOIN credentials c ON c.user_id = l.user_id
WHERE c.role <> 'LAB';

-- 7) Quick join view (good for viva)
SELECT
  c.role,
  u.first_name,
  u.last_name,
  sb.license_no,
  sb.organization,
  d.specialization,
  p.pharmacy_name,
  l.lab_name
FROM staff_base sb
JOIN credentials c ON c.user_id = sb.user_id
JOIN users u ON u.user_id = sb.user_id
LEFT JOIN doctors d ON d.user_id = sb.user_id
LEFT JOIN pharmacies p ON p.user_id = sb.user_id
LEFT JOIN labs l ON l.user_id = sb.user_id
ORDER BY c.role;
