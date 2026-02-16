-- Staff Tables (Doctors, Pharmacy, Lab)

-- 1. Doctor
CREATE SEQUENCE doctor_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS doctor (
  doctor_id VARCHAR(12) PRIMARY KEY,
  user_id VARCHAR(12),
  license_no VARCHAR(15) NOT NULL,
  nic_no VARCHAR(12) NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male','Female')),
  image_url VARCHAR(2048),
  specialization VARCHAR(25) NOT NULL,
  certification_url VARCHAR(2048) NOT NULL,

  CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 2. Pharmacy
CREATE SEQUENCE pharmacy_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS pharmacy (
  pharmacy_id VARCHAR(12) PRIMARY KEY,
  user_id VARCHAR(12),
  pharmacy_license_no VARCHAR(15) NOT NULL,
  business_registration_number VARCHAR(50) NOT NULL,
  business_registration_url VARCHAR(2048) NOT NULL,
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,

  CONSTRAINT fk_pharmacy_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Lab
CREATE SEQUENCE lab_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS lab (
  lab_id VARCHAR(12) PRIMARY KEY,
  user_id VARCHAR(12),
  license_no VARCHAR(15) NOT NULL,
  business_registration_number VARCHAR(50) NOT NULL,
  business_registration_url VARCHAR(2048) NOT NULL,
  available_date DATE NOT NULL,
  available_time TIME NOT NULL,
  avilable_tests TEXT NOT NULL,

  CONSTRAINT fk_lab_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);