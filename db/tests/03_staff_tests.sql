DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM staff_base) THEN
    RAISE EXCEPTION 'TEST FAIL: staff_base table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM doctors) THEN
    RAISE EXCEPTION 'TEST FAIL: doctors table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pharmacies) THEN
    RAISE EXCEPTION 'TEST FAIL: pharmacies table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM labs) THEN
    RAISE EXCEPTION 'TEST FAIL: labs table is empty';
  END IF;
END $$;
