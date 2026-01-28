-- placeholder
SELECT * FROM orders
WHERE patient_id = 1;

SELECT * FROM lab_reports
WHERE patient_id = 1;

SELECT *
FROM lab_reports
WHERE uploaded_at >= CURRENT_DATE - INTERVAL '7 days';
