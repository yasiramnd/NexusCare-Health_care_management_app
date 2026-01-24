-- Option A: Single staff table (RBAC decides Doctor/Pharmacist/Lab)
-- Depends on users(id)

CREATE TABLE IF NOT EXISTS staff (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  registration_no VARCHAR(50) NOT NULL UNIQUE,
  organization VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful index for searching by org
CREATE INDEX IF NOT EXISTS idx_staff_organization ON staff (organization);
