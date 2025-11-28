-- Phase 1.1 initial schema (core entities, DECIMAL money, FK integrity, soft deletes on master data)

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  internal_id TEXT UNIQUE,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  vat_number TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  price_segment TEXT,
  default_currency CHAR(3) DEFAULT 'EUR',
  default_language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  role TEXT NOT NULL DEFAULT 'other' CHECK (role IN ('billing', 'shipping', 'other')),
  is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
  is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  company TEXT,
  street TEXT,
  zip TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_customer_default_billing
  ON customer_addresses(customer_id)
  WHERE is_default_billing = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS ux_customer_default_shipping
  ON customer_addresses(customer_id)
  WHERE is_default_shipping = TRUE;

CREATE TABLE IF NOT EXISTS customer_contacts (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'finished' CHECK (type IN ('finished', 'device', 'consumable', 'part', 'component', 'service')),
  unit TEXT NOT NULL DEFAULT 'Stk',
  allow_decimal_qty BOOLEAN NOT NULL DEFAULT FALSE,
  avg_purchase_price DECIMAL(12,4) DEFAULT 0,
  dealer_price DECIMAL(12,4),
  end_customer_price DECIMAL(12,4),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  lifecycle_status TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('phaseIn', 'active', 'phaseOut', 'obsolete')),
  min_stock DECIMAL(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS price_lists (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('segment', 'customer')),
  segment_id TEXT,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (
    (type = 'segment' AND segment_id IS NOT NULL AND customer_id IS NULL) OR
    (type = 'customer' AND customer_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS price_list_items (
  id BIGSERIAL PRIMARY KEY,
  price_list_id BIGINT NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  price DECIMAL(12,4) NOT NULL,
  uvp DECIMAL(12,4),
  min_order_qty DECIMAL(14,4) DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_price_list_item_unique
  ON price_list_items(price_list_id, product_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  price_list_id BIGINT REFERENCES price_lists(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_production', 'ready_to_ship', 'shipped', 'invoiced', 'closed', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_delivery DATE,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  subtotal_net DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_gross DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  delivery_terms TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  quantity DECIMAL(14,4) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'Stk',
  unit_price DECIMAL(12,4) NOT NULL,
  discount DECIMAL(8,4) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  line_net DECIMAL(14,2) NOT NULL,
  line_vat DECIMAL(14,2) NOT NULL,
  line_total DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('delivery_note', 'invoice', 'credit_note')),
  doc_number TEXT UNIQUE,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  billing_address_id BIGINT REFERENCES customer_addresses(id) ON DELETE SET NULL,
  shipping_address_id BIGINT REFERENCES customer_addresses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'paid', 'cancelled')),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  net_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  gross_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  vat_summary JSONB,
  payment_terms TEXT,
  delivery_terms TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(order_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer_id);

CREATE TABLE IF NOT EXISTS document_items (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  line_number INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'Stk',
  quantity DECIMAL(14,4) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,4) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  line_net DECIMAL(14,2) NOT NULL,
  line_vat DECIMAL(14,2) NOT NULL,
  line_total DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_document_items_document ON document_items(document_id);

CREATE TABLE IF NOT EXISTS number_sequences (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  suffix TEXT NOT NULL DEFAULT '',
  pad_length INTEGER NOT NULL DEFAULT 5,
  current_year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  reset_annually BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'issue', 'adjustment', 'production_in', 'production_out', 'shipment')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity DECIMAL(14,4) NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12,4),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  lot_code TEXT,
  location TEXT,
  notes TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_document ON inventory_movements(document_id);

CREATE TABLE IF NOT EXISTS settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT,
  company_address TEXT,
  vat_number TEXT,
  default_currency CHAR(3) NOT NULL DEFAULT 'EUR',
  default_vat_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  default_payment_terms TEXT,
  default_delivery_terms TEXT,
  language_default TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed core reference data
INSERT INTO roles (name, description)
VALUES
  ('admin', 'Full access'),
  ('sales', 'Sales and documents'),
  ('warehouse', 'Inventory and logistics'),
  ('production', 'Production operations'),
  ('readonly', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

INSERT INTO number_sequences (key, prefix, suffix, pad_length, current_year, last_number, reset_annually)
VALUES
  ('order', 'A', '', 5, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0, TRUE),
  ('delivery_note', 'L', '', 5, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0, TRUE),
  ('invoice', 'R', '', 5, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0, TRUE),
  ('credit_note', 'G', '', 5, EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0, TRUE)
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (id, company_name, company_address, vat_number, default_currency, default_vat_rate, default_payment_terms, default_delivery_terms, language_default)
VALUES (
  1,
  'MicroOps GmbH',
  'Example Street 1, 1010 Vienna, AT',
  'ATU00000000',
  'EUR',
  20.00,
  'Net 30',
  'DAP',
  'de'
)
ON CONFLICT (id) DO NOTHING;
