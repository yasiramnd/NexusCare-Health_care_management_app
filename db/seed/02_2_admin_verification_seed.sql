INSERT INTO admins (user_id, access_level)
SELECT user_id, 'SuperAdmin'
FROM users WHERE first_name='System'
ON CONFLICT DO NOTHING;

INSERT INTO verification_requests (
    applicant_user_id,
    reviewer_admin_id,
    status,
    document_url
)
SELECT
    u.user_id,
    a.admin_id,
    'Approved',
    'https://firebase.storage/admin-doc.pdf'
FROM users u
JOIN admins a ON a.user_id = (SELECT user_id FROM users WHERE first_name='System')
WHERE u.first_name='John'
ON CONFLICT DO NOTHING;
