CREATE TABLE IF NOT EXISTS payments (
  payment_id VARCHAR(10) PRIMARY KEY,

  patient_id VARCHAR(10) NOT NULL
    REFERENCES patient(patient_id)
    ON DELETE CASCADE,

  appointment_id VARCHAR(10)
    REFERENCES appointment(appointment_id)
    ON DELETE CASCADE,

  p_order_id VARCHAR(10),

    n_order_id VARCHAR(10),

  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'LKR',

  provider VARCHAR(30) NOT NULL DEFAULT 'PAYHERE'
    CHECK (provider IN ('PAYHERE','STRIPE','CASH','BANK_TRANSFER')),

  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED','CANCELLED')),

  provider_payment_ref VARCHAR(120),
  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT n_order_id FOREIGN KEY (n_order_id) REFERENCES normal_order(order_id) ON DELETE CASCADE,
  CONSTRAINT p_order_id FOREIGN KEY (p_order_id) REFERENCES priority_order(order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_patient
  ON payments(patient_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_success_appointment
  ON payments(appointment_id)
  WHERE status = 'SUCCESS' AND appointment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_success_order
  ON payments(order_id)
  WHERE status = 'SUCCESS' AND order_id IS NOT NULL;
