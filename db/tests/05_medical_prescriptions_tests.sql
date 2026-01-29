-- Get full medical history with prescriptions
SELECT
    u.full_name AS patient_name,
    mr.diagnosis,
    mr.visit_date,
    p.medicine_name,
    p.dosage,
    p.frequency,
    p.duration_days
FROM medical_record mr
JOIN patients pa ON pa.patient_id = mr.patient_id
JOIN users u ON u.user_id = pa.user_id
JOIN prescription p ON p.record_id = mr.record_id;

-- List all prescriptions by a doctor
SELECT
    p.medicine_name,
    p.dosage,
    p.frequency,
    p.duration_days
FROM prescription p
WHERE p.doctor_id = 1;