-- Admin ID sequence
CREATE SEQUENCE IF NOT EXISTS admin_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS admins (
  admin_id VARCHAR(10) PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  access_level VARCHAR(20) NOT NULL DEFAULT 'Moderator'
    CHECK (access_level IN ('SuperAdmin','Moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_admin_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_id IS NULL OR NEW.admin_id = '' THEN
    NEW.admin_id := 'AD' || LPAD(nextval('admin_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_admin_id ON admins;
CREATE TRIGGER trg_generate_admin_id
BEFORE INSERT ON admins
FOR EACH ROW
EXECUTE FUNCTION generate_admin_id();

-- Verification workflow (for staff approvals)
CREATE TABLE IF NOT EXISTS verification_requests (
  request_id BIGSERIAL PRIMARY KEY,
  applicant_user_id UUID NOT NULL UNIQUE,   -- 1 request per applicant (can be changed later)
  reviewer_admin_id VARCHAR(10),            -- nullable until processed
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected')),
  document_url VARCHAR(2048),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  CONSTRAINT fk_verification_applicant
    FOREIGN KEY (applicant_user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_verification_reviewer
    FOREIGN KEY (reviewer_admin_id)
    REFERENCES admins(admin_id)
    ON DELETE SET NULL,

  CONSTRAINT chk_processed_time
    CHECK (
      (status = 'Pending' AND processed_at IS NULL)
      OR (status IN ('Approved','Rejected') AND processed_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_verif_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verif_submitted ON verification_requests(submitted_at);
