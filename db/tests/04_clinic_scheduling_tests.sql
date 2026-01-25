-- Available slots for a doctor (doctor1)
SELECT
    a.available_date,
    a.available_time,
    c.clinic_location
FROM availability a
JOIN clinic c ON a.clinic_id = c.clinic_id
JOIN users du ON du.email = 'doctor1@nexuscare.lk'
JOIN staff d ON d.user_id = du.id
WHERE a.doctor_id = d.user_id
  AND a.is_available = TRUE
ORDER BY a.available_date, a.available_time;

-- Appointments for a patient (patient1)
SELECT
    ap.appointment_date,
    ap.appointment_time,
    ap.status,
    c.clinic_location,
    du.email AS doctor_email
FROM appointment ap
JOIN clinic c ON ap.clinic_id = c.clinic_id
JOIN users du ON du.id = ap.doctor_id
JOIN users pu ON pu.email = 'patient1@nexuscare.lk'
JOIN patients p ON p.patient_id = pu.id
WHERE ap.patient_id = p.patient_id
ORDER BY ap.appointment_date DESC, ap.appointment_time DESC;



