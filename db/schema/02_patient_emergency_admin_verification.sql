-- Patient & Emergency Tables

CREATE SEQUENCE IF NOT EXISTS patient_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS patient (
    patient_id VARCHAR(12) PRIMARY KEY,
    user_id VARCHAR(12) UNIQUE NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male','Female')),
    image_url VARCHAR(2048),
    QR_code VARCHAR(2048),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_patient_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_profile (
    patient_id VARCHAR(12) PRIMARY KEY,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    chronic_conditions TEXT,
    blood_group VARCHAR(5),
    allergies TEXT,
    is_public_visible BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_emergency_patient
        FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE
);

-- Admin & Verification Tables

CREATE SEQUENCE admin_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS admin (
    admin_id VARCHAR(12) PRIMARY KEY,
    user_id VARCHAR(12),
    access_level VARCHAR(20) DEFAULT 'Moderator' CHECK (access_level IN ('SuperAdmin', 'Moderator')),
    
    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_request (
    request_id SERIAL PRIMARY KEY,
    applicant_user_id VARCHAR(12),
    reviewer_admin_id VARCHAR(12),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    document_url VARCHAR(2048),
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    CONSTRAINT fk_verification_applicant
        FOREIGN KEY (applicant_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        
    CONSTRAINT fk_verification_reviewer
        FOREIGN KEY (reviewer_admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL
);