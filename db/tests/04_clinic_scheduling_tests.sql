DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clinic) THEN
    RAISE EXCEPTION 'TEST FAIL: clinic table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM availability) THEN
    RAISE EXCEPTION 'TEST FAIL: availability table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM appointment) THEN
    RAISE EXCEPTION 'TEST FAIL: appointment table is empty';
  END IF;
END $$;
