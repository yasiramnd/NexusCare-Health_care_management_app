DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders) THEN
    RAISE EXCEPTION 'TEST FAIL: orders table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM priority_orders) THEN
    RAISE EXCEPTION 'TEST FAIL: priority_orders table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM recommended_reports) THEN
    RAISE EXCEPTION 'TEST FAIL: recommended_reports table is empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM lab_reports) THEN
    RAISE EXCEPTION 'TEST FAIL: lab_reports table is empty';
  END IF;
END $$;
