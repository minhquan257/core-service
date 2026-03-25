-- ============================================================
--  Add phone_number column and populate with random numbers
--  Run with: psql -U postgres -d demo -f src/sqli/add_phone_numbers.sql
-- ============================================================

-- Add column if it doesn't exist yet (safe to re-run)
ALTER TABLE safe_customers
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Generate random Vietnamese-style phone numbers (10 digits, starts with 0)
-- Prefixes used by Vietnamese carriers: 03x, 05x, 07x, 08x, 09x
UPDATE safe_customers
SET phone_number = concat(
  '0',
  (array['3','5','7','8','9'])[1 + floor(random() * 5)::int],  -- network prefix digit
  lpad((floor(random() * 100000000))::text, 8, '0')             -- 8 remaining digits
)
WHERE phone_number IS NULL OR phone_number NOT LIKE '0%';
