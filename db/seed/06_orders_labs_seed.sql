-- placeholder
-- Orders
INSERT INTO orders (patient_id, prescription_id, total_price)
VALUES (1, 1, 2500.00);

-- Priority order
INSERT INTO priority_orders (order_id, collecting_time, additional_charge)
VALUES (1, '2 hours', 500.00);

-- Normal order
INSERT INTO normal_orders (order_id, is_prepared)
VALUES (1, TRUE);

-- Recommended report
INSERT INTO recommended_reports (patient_id, doctor_id, test_name)
VALUES (1, 2, 'Blood Sugar');

-- Lab report
INSERT INTO lab_reports (patient_id, doctor_id, lab_id, test_name, file_url)
VALUES (1, 2, 3, 'Blood Sugar', 'https://example.com/report1.pdf');
