-- Ensure only one SUCCESS payment per appointment
SELECT appointment_id, COUNT(*)
FROM payments
WHERE status = 'SUCCESS'
GROUP BY appointment_id
HAVING COUNT(*) > 1;

-- Ensure only one SUCCESS payment per order
SELECT order_id, COUNT(*)
FROM payments
WHERE status = 'SUCCESS'
GROUP BY order_id
HAVING COUNT(*) > 1;
