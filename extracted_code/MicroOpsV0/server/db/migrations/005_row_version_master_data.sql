-- 005_row_version_master_data.sql
-- Add optimistic concurrency tokens to master data tables (customers, products)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS row_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS row_version INTEGER NOT NULL DEFAULT 1;

-- Ensure existing rows have a concrete starting version
UPDATE customers SET row_version = 1 WHERE row_version IS NULL;
UPDATE products SET row_version = 1 WHERE row_version IS NULL;
