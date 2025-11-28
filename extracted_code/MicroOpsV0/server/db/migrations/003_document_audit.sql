-- 003_document_audit.sql
-- Adds traceability fields for legal documents (template version and reprint tracking)

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS legal_template_version TEXT,
  ADD COLUMN IF NOT EXISTS printed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_printed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_printed_by INTEGER REFERENCES users(id);
