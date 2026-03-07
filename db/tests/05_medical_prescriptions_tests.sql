DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM medical_record) THEN
    RAISE EXCEPTION 'TEST FAIL: medical_record table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM prescription) THEN
    RAISE EXCEPTION 'TEST FAIL: prescription table is empty';
  END IF;
END $$;
