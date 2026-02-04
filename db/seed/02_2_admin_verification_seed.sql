-- Create admin profile for the System Admin user
INSERT INTO admins (user_id, access_level)
SELECT u.user_id, 'SuperAdmin'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role = 'ADMIN'
ON CONFLICT (user_id) DO NOTHING;

-- Create a verification request for doctor user (example)
INSERT INTO verification_requests (applicant_user_id, document_url)
SELECT u.user_id, 'https://example.com/slmc_doc.pdf'
FROM users u
JOIN credentials c ON c.user_id = u.user_id
WHERE c.role = 'DOCTOR'
ON CONFLICT (applicant_user_id) DO NOTHING;
