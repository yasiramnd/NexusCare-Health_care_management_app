-- base staff rows
-- doctor
INSERT INTO staff_base (user_id, license_no, organization)
SELECT u.user_id, 'DOC-SL-0001', 'National Hospital Colombo'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role='DOCTOR'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, specialization, consultation_fee, slmc_expiry_date)
SELECT sb.user_id, 'General Medicine', 2000.00, CURRENT_DATE + INTERVAL '365 days'
FROM staff_base sb
JOIN credentials c ON c.user_id = sb.user_id
WHERE c.role='DOCTOR'
ON CONFLICT (user_id) DO NOTHING;

-- pharmacy
INSERT INTO staff_base (user_id, license_no, organization)
SELECT u.user_id, 'PHAR-SL-0101', 'Union Pharmacy'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role='PHARMACY'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO pharmacies (user_id, pharmacy_license_no, pharmacy_name, is_24_hours)
SELECT sb.user_id, 'PH-LIC-7777', 'City Pharmacy', FALSE
FROM staff_base sb
JOIN credentials c ON c.user_id = sb.user_id
WHERE c.role='PHARMACY'
ON CONFLICT (user_id) DO NOTHING;

-- lab
INSERT INTO staff_base (user_id, license_no, organization)
SELECT u.user_id, 'LAB-SL-0201', 'Lanka Diagnostic Center'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role='LAB'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO labs (user_id, lab_license_no, lab_name, is_24_hours)
SELECT sb.user_id, 'LAB-LIC-8888', 'Lanka Lab', FALSE
FROM staff_base sb
JOIN credentials c ON c.user_id = sb.user_id
WHERE c.role='LAB'
ON CONFLICT (user_id) DO NOTHING;
