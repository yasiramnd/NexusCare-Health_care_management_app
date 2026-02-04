DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM patients) THEN
    RAISE EXCEPTION 'TEST FAIL: patients table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM emergency_profile) THEN
    RAISE EXCEPTION 'TEST FAIL: emergency_profile table is empty';
  END IF;
END $$;
