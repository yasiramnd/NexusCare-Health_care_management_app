-- Orders should belong to a pharmacy
CREATE TABLE IF NOT EXISTS orders (
  order_id BIGSERIAL PRIMARY KEY,
  patient_id VARCHAR(10) NOT NULL,
  pharmacy_id UUID NOT NULL,
  prescription_id BIGINT,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_order_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,

  CONSTRAINT fk_order_pharmacy
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(user_id) ON DELETE CASCADE,

  CONSTRAINT fk_order_prescription
    FOREIGN KEY (prescription_id) REFERENCES prescription(prescription_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_patient   ON orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy  ON orders(pharmacy_id);

CREATE TABLE IF NOT EXISTS priority_orders (
  order_id BIGINT PRIMARY KEY,
  collecting_time INTERVAL,
  additional_charge NUMERIC(10,2) NOT NULL DEFAULT 0,

  CONSTRAINT fk_priority_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS normal_orders (
  order_id BIGINT PRIMARY KEY,
  is_prepared BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_normal_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Doctor recommends a lab test (tie to record_id for audit/RAG context)
CREATE TABLE IF NOT EXISTS recommended_reports (
  recommendation_id BIGSERIAL PRIMARY KEY,
  record_id BIGINT NOT NULL,
  patient_id VARCHAR(10) NOT NULL,
  doctor_id UUID NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED','UPLOADED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_reco_record
    FOREIGN KEY (record_id) REFERENCES medical_record(record_id) ON DELETE CASCADE,

  CONSTRAINT fk_reco_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,

  CONSTRAINT fk_reco_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reco_patient ON recommended_reports(patient_id);

-- Lab uploads result (must be a lab)
CREATE TABLE IF NOT EXISTS lab_reports (
  lab_report_id BIGSERIAL PRIMARY KEY,
  recommendation_id BIGINT NOT NULL,
  patient_id VARCHAR(10) NOT NULL,
  doctor_id UUID NOT NULL,
  lab_id UUID NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_lab_reco
    FOREIGN KEY (recommendation_id) REFERENCES recommended_reports(recommendation_id) ON DELETE CASCADE,

  CONSTRAINT fk_lab_patient
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,

  CONSTRAINT fk_lab_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE,

  CONSTRAINT fk_lab_lab
    FOREIGN KEY (lab_id) REFERENCES labs(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_lab     ON lab_reports(lab_id);
