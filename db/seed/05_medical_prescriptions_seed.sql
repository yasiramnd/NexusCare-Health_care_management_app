-- medical record
INSERT INTO medical_record (patient_id, doctor_id, diagnosis, notes, visit_date)
SELECT p.patient_id, d.user_id, 'Fever and cough', 'Mild viral infection', CURRENT_DATE
FROM users pu
JOIN patients p ON p.user_id = pu.user_id
JOIN users du ON du.first_name='John' AND du.last_name='Doctor'
JOIN doctors d ON d.user_id = du.user_id
WHERE pu.first_name='Jane' AND pu.last_name='Patient'
ON CONFLICT DO NOTHING;

-- prescription for last record
INSERT INTO prescription (record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration_days)
SELECT mr.record_id, mr.patient_id, mr.doctor_id, 'Paracetamol', '500mg', 'Twice a day', 5
FROM medical_record mr
ORDER BY mr.record_id DESC
LIMIT 1
ON CONFLICT DO NOTHING;
