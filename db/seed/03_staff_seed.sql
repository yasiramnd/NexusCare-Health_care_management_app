-- 1) Insert staff_base rows for DOCTOR / LAB / PHARMACY
INSERT INTO staff_base (user_id, license_no, organization)
SELECT
  c.user_id,
  CASE c.role
    WHEN 'DOCTOR'   THEN 'DOC-SL-0001'
    WHEN 'LAB'      THEN 'LAB-SL-0201'
    WHEN 'PHARMACY' THEN 'PHAR-SL-0101'
    ELSE 'STAFF-SL-0000'
  END AS license_no,
  CASE c.role
    WHEN 'DOCTOR'   THEN 'National Hospital Colombo'
    WHEN 'LAB'      THEN 'Lanka Diagnostic Center'
    WHEN 'PHARMACY' THEN 'City Pharmacy'
    ELSE 'NexusCare'
  END AS organization
FROM credentials c
WHERE c.role IN ('DOCTOR','LAB','PHARMACY')
ON CONFLICT (user_id) DO NOTHING;


-- 2) Doctor profile (only for role=DOCTOR)
INSERT INTO doctors (user_id, specialization, consultation_fee, slmc_expiry_date)
SELECT
  c.user_id,
  'General Physician',
  1500.00,
  (CURRENT_DATE + INTERVAL '365 days')::date
FROM credentials c
WHERE c.role = 'DOCTOR'
ON CONFLICT (user_id) DO NOTHING;


-- 3) Pharmacy profile (only for role=PHARMACY)
INSERT INTO pharmacies (user_id, pharmacy_license_no, pharmacy_name, is_24_hours)
SELECT
  c.user_id,
  'PH-LIC-1001',
  'City Pharmacy - Kurunegala',
  FALSE
FROM credentials c
WHERE c.role = 'PHARMACY'
ON CONFLICT (user_id) DO NOTHING;


-- 4) Lab profile (only for role=LAB)
INSERT INTO labs (user_id, lab_license_no, lab_name, is_24_hours)
SELECT
  c.user_id,
  'LAB-LIC-2001',
  'Lanka Diagnostic Center - Galle',
  FALSE
FROM credentials c
WHERE c.role = 'LAB'
ON CONFLICT (user_id) DO NOTHING;
