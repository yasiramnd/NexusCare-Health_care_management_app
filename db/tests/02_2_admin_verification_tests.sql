SELECT
    admin_id,
    user_id,
    access_level
FROM admins;


SELECT
    request_id,
    applicant_user_id,
    reviewer_admin_id,
    status,
    submitted_at,
    processed_at
FROM verification_requests;


SELECT applicant_user_id, COUNT(*) AS pending_count
FROM verification_requests
WHERE status = 'Pending'
GROUP BY applicant_user_id
HAVING COUNT(*) > 1;


SELECT
    vr.request_id,
    vr.status,
    a.admin_id,
    a.access_level
FROM verification_requests vr
LEFT JOIN admins a
    ON vr.reviewer_admin_id = a.admin_id;


SELECT
    vr.request_id,
    u.first_name,
    u.last_name,
    vr.status
FROM verification_requests vr
JOIN users u
    ON vr.applicant_user_id = u.user_id
WHERE vr.status = 'Approved';


SELECT
    vr.request_id,
    u.first_name || ' ' || u.last_name AS applicant_name,
    vr.document_url,
    vr.submitted_at
FROM verification_requests vr
JOIN users u
    ON vr.applicant_user_id = u.user_id
WHERE vr.status = 'Pending';


SELECT *
FROM verification_requests
WHERE status = 'Rejected'
  AND rejection_reason IS NULL;


SELECT vr.*
FROM verification_requests vr
LEFT JOIN users u
    ON vr.applicant_user_id = u.user_id
WHERE u.user_id IS NULL;
