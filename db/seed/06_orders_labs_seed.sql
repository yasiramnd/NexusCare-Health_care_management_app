-- Create an order for patient1 at pharmacy1 using latest prescription
INSERT INTO orders (patient_id, pharmacy_id, prescription_id, total_price)
SELECT p.patient_id, ph.user_id, pr.prescription_id, 2500.00
FROM users pu
JOIN patients p ON p.user_id = pu.user_id
JOIN users phu ON phu.first_name='City' AND phu.last_name='Pharmacy'
JOIN pharmacies ph ON ph.user_id = phu.user_id
JOIN prescription pr ON TRUE
ORDER BY pr.prescription_id DESC
LIMIT 1;

-- Make it a priority order (for the last order)
INSERT INTO priority_orders (order_id, collecting_time, additional_charge)
SELECT o.order_id, INTERVAL '2 hours', 500.00
FROM orders o
ORDER BY o.order_id DESC
LIMIT 1;

-- Recommend a report for latest medical record
INSERT INTO recommended_reports (record_id, patient_id, doctor_id, test_name)
SELECT mr.record_id, mr.patient_id, mr.doctor_id, 'Blood Sugar'
FROM medical_record mr
ORDER BY mr.record_id DESC
LIMIT 1;

-- Lab uploads report
INSERT INTO lab_reports (recommendation_id, patient_id, doctor_id, lab_id, test_name, file_url)
SELECT rr.recommendation_id, rr.patient_id, rr.doctor_id, lb.user_id, rr.test_name, 'https://example.com/report1.pdf'
FROM recommended_reports rr
JOIN users lu ON lu.first_name='Lanka' AND lu.last_name='Lab'
JOIN labs lb ON lb.user_id = lu.user_id
ORDER BY rr.recommendation_id DESC
LIMIT 1;
