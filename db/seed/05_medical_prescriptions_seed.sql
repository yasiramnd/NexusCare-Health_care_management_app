-- Insert a medical record
INSERT INTO medical_record (patient_id, doctor_id, diagnosis, notes, visit_date)
VALUES
(
    1,  -- patient_id from Member 2
    1,  -- doctor_id from Member 3
    'Fever and cough',
    'Patient has mild viral infection',
    '2026-01-20'
)
ON CONFLICT DO NOTHING;

-- Insert a prescription for that record
INSERT INTO prescription (record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration_days)
VALUES
(
    (SELECT record_id FROM medical_record LIMIT 1),
    1,
    1,
    'Paracetamol',
    '500mg',
    'Twice a day',
    5
)
ON CONFLICT DO NOTHING;
