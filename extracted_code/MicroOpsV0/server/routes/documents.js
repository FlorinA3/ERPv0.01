const express = require('express');
const {
  documentCreateSchema,
  documentUpdateSchema,
  documentPostSchema,
  documentPaySchema,
  documentReprintSchema,
} = require('../validation/schemas');
const { validateBody } = require('../validation/middleware');
const { requireRole } = require('../middleware/auth');
const documentRepository = require('../repositories/documentRepository');
const documentService = require('../services/documentService');

const router = express.Router();

const READ_ROLES = ['admin', 'sales', 'warehouse', 'production', 'readonly'];
const WRITE_ROLES = ['admin', 'sales'];

router.get(
  '/',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const { type, status, customerId, page, limit } = req.query;
      const docs = await documentRepository.listDocuments({
        type,
        status,
        customerId,
        page,
        limit,
      });
      res.json(docs);
    } catch (err) {
      console.error('List documents error:', err);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
);

router.get(
  '/:id',
  requireRole(READ_ROLES),
  async (req, res) => {
    try {
      const doc = await documentService.getDocumentWithItems(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(doc);
    } catch (err) {
      console.error('Get document error:', err);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
);

router.post(
  '/',
  requireRole(WRITE_ROLES),
  validateBody(documentCreateSchema),
  async (req, res) => {
    try {
      const created = await documentService.createDraftDocument({
        ...req.validated,
        created_by: req.user?.id,
      });
      res.status(201).json(created);
    } catch (err) {
      console.error('Create document error:', err);
      res.status(400).json({ error: err.message || 'Failed to create document' });
    }
  }
);

router.patch(
  '/:id',
  requireRole(WRITE_ROLES),
  validateBody(documentUpdateSchema),
  async (req, res) => {
    try {
      const updated = await documentService.updateDraftDocument(req.params.id, {
        ...req.validated,
        updated_by: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.code === 'IMMUTABLE_DOCUMENT' || (err.message && err.message.includes('Only draft documents'))) {
        return res.status(409).json({ error: err.message });
      }
      if (err.code === 'NOT_FOUND' || err.message === 'Document not found') {
        return res.status(404).json({ error: err.message });
      }
      console.error('Update document error:', err);
      res.status(400).json({ error: err.message || 'Failed to update document' });
    }
  }
);

router.post(
  '/:id/post',
  requireRole(WRITE_ROLES),
  validateBody(documentPostSchema),
  async (req, res) => {
    try {
      const updated = await documentService.postDocument(req.params.id, {
        ...req.validated,
        updated_by: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_TRANSITION') {
        return res.status(409).json({ error: err.message });
      }
      console.error('Post document error:', err);
      res.status(400).json({ error: err.message || 'Failed to post document' });
    }
  }
);

router.post(
  '/:id/pay',
  requireRole(WRITE_ROLES),
  validateBody(documentPaySchema),
  async (req, res) => {
    try {
      const updated = await documentService.markDocumentPaid(req.params.id, {
        ...req.validated,
        updated_by: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_TRANSITION') {
        return res.status(409).json({ error: err.message });
      }
      console.error('Pay document error:', err);
      res.status(400).json({ error: err.message || 'Failed to mark paid' });
    }
  }
);

router.post(
  '/:id/cancel',
  requireRole(WRITE_ROLES),
  async (req, res) => {
    try {
      const updated = await documentService.cancelDocument(req.params.id, {
        updated_by: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_TRANSITION') {
        return res.status(409).json({ error: err.message });
      }
      console.error('Cancel document error:', err);
      res.status(400).json({ error: err.message || 'Failed to cancel document' });
    }
  }
);

router.post(
  '/:id/reprint',
  requireRole(READ_ROLES),
  validateBody(documentReprintSchema),
  async (req, res) => {
    try {
      const updated = await documentService.registerReprint(req.params.id, {
        legal_template_version: req.validated.legal_template_version,
        printed_at: req.validated.printed_at,
        user_id: req.user?.id,
      });
      res.json(updated);
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message });
      }
      if (err.code === 'INVALID_STATUS_FOR_REPRINT') {
        return res.status(409).json({ error: err.message });
      }
      console.error('Reprint document error:', err);
      res.status(400).json({ error: err.message || 'Failed to register reprint' });
    }
  }
);

module.exports = router;
