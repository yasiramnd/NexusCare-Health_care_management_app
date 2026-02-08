CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  patient_id VARCHAR(10) NOT NULL
    REFERENCES patients(patient_id)
    ON DELETE CASCADE,

  appointment_id UUID
    REFERENCES appointment(appointment_id)
    ON DELETE CASCADE,

  order_id BIGINT
    REFERENCES orders(order_id)
    ON DELETE CASCADE,

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

  CONSTRAINT chk_payment_target
    CHECK (
      (appointment_id IS NOT NULL AND order_id IS NULL)
      OR
      (appointment_id IS NULL AND order_id IS NOT NULL)
    )
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
