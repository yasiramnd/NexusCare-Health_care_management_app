-- Sample payment for appointment
INSERT INTO payments (
  patient_id,
  appointment_id,
  amount,
  provider,
  status,
  provider_payment_ref,
  paid_at
)
VALUES (
  'PT0001',
  (SELECT appointment_id FROM appointment LIMIT 1),
  2500.00,
  'PAYHERE',
  'SUCCESS',
  'PH123456789',
  NOW()
);

-- Sample payment for pharmacy order
INSERT INTO payments (
  patient_id,
  order_id,
  amount,
  provider,
  status,
  provider_payment_ref,
  paid_at
)
VALUES (
  'PT0001',
  (SELECT order_id FROM orders LIMIT 1),
  1800.00,
  'PAYHERE',
  'SUCCESS',
  'PH987654321',
  NOW()
);
