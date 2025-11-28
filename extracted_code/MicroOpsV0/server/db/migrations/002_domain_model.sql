-- Phase 2.1 - Domain model hardening (add credit note link, tighten inventory movements)

-- Allow credit notes to point to their original invoice (or another source document).
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS related_document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL;

COMMENT ON COLUMN documents.related_document_id IS 'Reference to original document (e.g. invoice) when type = credit_note';

-- Prevent non-credit documents from storing a related_document_id.
ALTER TABLE documents
ADD CONSTRAINT ck_documents_credit_link
CHECK (
  related_document_id IS NULL
  OR type = 'credit_note'
);

-- Shipments must be tied to a document for traceability.
ALTER TABLE inventory_movements
ADD CONSTRAINT ck_inventory_shipment_requires_document
CHECK (
  movement_type <> 'shipment'
  OR document_id IS NOT NULL
);
