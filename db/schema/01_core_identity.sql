-- Member 1 (Final ERD): User + Credential
-- Firebase Auth: DO NOT store passwords in PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   VARCHAR(60) NOT NULL,
  last_name    VARCHAR(60) NOT NULL,
  contact_no1  VARCHAR(20),
  contact_no2  VARCHAR(20),
  address      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
  user_id UUID PRIMARY KEY,                  -- 1:1 with users (ERD)
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,  -- from Firebase Auth
  user_name   VARCHAR(80) UNIQUE NOT NULL,
  email       VARCHAR(120) UNIQUE NOT NULL,

  role VARCHAR(20) NOT NULL
    CHECK (role IN ('ADMIN','DOCTOR','PATIENT','LAB','PHARMACY','RESPONDER')),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_credentials_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);
