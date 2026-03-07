-- Core Identity Tables
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for Users
CREATE SEQUENCE IF NOT EXISTS user_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(12) PRIMARY KEY,
  name   VARCHAR(60) NOT NULL,
  contact_no1  VARCHAR(20) NOT NULL,
  contact_no2  VARCHAR(20),
  address      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

