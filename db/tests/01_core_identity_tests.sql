DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users) THEN
    RAISE EXCEPTION 'TEST FAIL: users table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM credentials) THEN
    RAISE EXCEPTION 'TEST FAIL: credentials table is empty';
  END IF;
END $$;
