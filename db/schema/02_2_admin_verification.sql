

-- Create sequence for admin numbers
CREATE SEQUENCE admin_seq
START 1
INCREMENT 1;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    admin_id VARCHAR(10) PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    access_level VARCHAR(20) DEFAULT 'Moderator' CHECK (access_level IN ('SuperAdmin', 'Moderator')),
    
    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Create trigger function for admin IDs
CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.admin_id := 'AD' || LPAD(nextval('admin_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admins
CREATE TRIGGER trg_generate_admin_id
BEFORE INSERT ON admins FOR EACH ROW
EXECUTE FUNCTION generate_admin_id();


-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    request_id SERIAL PRIMARY KEY,
    applicant_user_id UUID UNIQUE NOT NULL,
    reviewer_admin_id VARCHAR(10), -- The admin who processes the request
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    document_url VARCHAR(2048), -- URL to the NIC or SLMC document in Firebase Storage
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    CONSTRAINT fk_verification_applicant
        FOREIGN KEY (applicant_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_verification_reviewer
        FOREIGN KEY (reviewer_admin_id)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);
