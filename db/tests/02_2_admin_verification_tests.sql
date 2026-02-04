DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins) THEN
    RAISE EXCEPTION 'TEST FAIL: admins table is empty';
  END IF;

  IF EXISTS (
    SELECT 1 FROM verification_requests
    WHERE status='Pending' AND processed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TEST FAIL: Pending request has processed_at';
  END IF;
END $$;
