-- 004_document_number_unique.sql
-- Enforce uniqueness of legal document numbers per type (only when doc_number is set)

CREATE UNIQUE INDEX IF NOT EXISTS ux_documents_type_doc_number
  ON documents(type, doc_number)
  WHERE doc_number IS NOT NULL;
