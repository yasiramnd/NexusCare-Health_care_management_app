-- =============================================
-- TEST SUITE: Verify Database Connections
-- =============================================

-- 1. CHECK USERS & ROLES
-- Should show names with generated IDs like NEX..., PT..., DOC...
SELECT 
    u.name, 
    u.user_id, 
    p.patient_id, 
    d.doctor_id, 
    ph.pharmacy_id 
FROM users u
LEFT JOIN patient p ON u.user_id = p.user_id
LEFT JOIN doctor d ON u.user_id = d.user_id
LEFT JOIN pharmacy ph ON u.user_id = ph.user_id;


-- 2. CHECK APPOINTMENT FLOW
-- Should show "Saman Kumara" has an appointment with "Dr. Nimal Perera"
SELECT 
    a.appointment_id,
    a.status,
    pat_u.name AS patient_name,
    doc_u.name AS doctor_name,
    c.clinic_location
FROM appointment a
JOIN patient p ON a.patient_id = p.patient_id
JOIN users pat_u ON p.user_id = pat_u.user_id
JOIN doctor d ON a.doctor_id = d.doctor_id
JOIN users doc_u ON d.user_id = doc_u.user_id
JOIN clinic c ON a.clinic_id = c.clinic_id;


-- 3. CHECK PRESCRIPTIONS & ORDERS
-- Should show "Paracetamol" ordered from "City Pharmacy"
SELECT 
    pr.medicine_name,
    pr.status AS prescription_status,
    po.total_price,
    pharm_u.name AS pharmacy_name
FROM prescription pr
JOIN priority_order po ON pr.prescription_id = po.prescription_id
JOIN pharmacy ph ON po.pharmacy_id = ph.pharmacy_id
JOIN users pharm_u ON ph.user_id = pharm_u.user_id;

-- 4. CHECK LAB DETAILS
-- Should show the tests available at Asiri Labs
SELECT 
    u.name AS lab_name,
    l.license_no,
    l.avilable_tests
FROM lab l
JOIN users u ON l.user_id = u.user_id;