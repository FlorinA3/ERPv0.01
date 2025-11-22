App.UI.Views.Documents = {
  render(root) {
    const docs = App.Data.documents || [];
    docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const getPaymentStatus = (doc) => {
      if (doc.type !== 'invoice') return '';
      const paid = doc.paidAmount || 0;
      const total = doc.grossTotal || 0;

      if (paid >= total) {
        return '<span class="tag tag-success">Paid</span>';
      }

      const now = new Date();
      const due = doc.dueDate ? new Date(doc.dueDate) : null;

      if (paid > 0 && paid < total) {
        return '<span class="tag" style="background:#dbeafe;color:#1d4ed8;">Partial</span>';
      }

      if (due && due < now) {
        const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
        return `<span class="tag tag-danger">Overdue ${daysOverdue}d</span>`;
      }

      return '<span class="tag tag-warning">Open</span>';
    };

    // Get finalization status badge
    const getFinalizationBadge = (doc) => {
      if (doc.type !== 'invoice') return '';
      if (doc.isFinalized) {
        return '<span class="tag tag-muted" title="' + App.I18n.t('documents.finalizedTooltip', 'This invoice is finalized and cannot be edited') + '">🔒</span>';
      }
      return '<span class="tag" style="background:var(--color-warning-bg);color:var(--color-warning);" title="' + App.I18n.t('documents.draftTooltip', 'Draft - can be edited') + '">Draft</span>';
    };

    const formatDueDate = (doc) => {
      if (doc.type !== 'invoice' || !doc.dueDate) return '-';
      return doc.dueDate.split('T')[0];
    };

    // Filter out deleted documents
    const activeDocs = docs.filter(d => !d.isDeleted);
    const deletedCount = docs.filter(d => d.isDeleted).length;

    root.innerHTML = `
      <div class="card-soft">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:16px; font-weight:600;">${App.I18n.t('pages.documents.title','Documents')}</h3>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="doc-search" class="input" placeholder="${App.I18n.t('common.search','Search...')}" style="width:200px;" />
            <button class="btn btn-ghost" id="btn-export-docs" title="${App.I18n.t('documents.exportCsv', 'Export CSV')}">📥 ${App.I18n.t('common.export', 'Export')}</button>
            ${deletedCount > 0 ? `<button class="btn btn-ghost" id="btn-view-trash" title="${App.I18n.t('documents.viewTrash', 'View Trash')}">🗑️ ${App.I18n.t('documents.trash', 'Trash')} (${deletedCount})</button>` : ''}
            <button class="btn btn-ghost" id="btn-add-delivery">+ ${App.I18n.t('documents.createDelivery','Delivery Note')}</button>
            <button class="btn btn-primary" id="btn-add-invoice">+ ${App.I18n.t('documents.createInvoice','Invoice')}</button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>${App.I18n.t('common.type', 'Type')}</th>
              <th>${App.I18n.t('common.number', 'Number')}</th>
              <th>${App.I18n.t('common.customer', 'Customer')}</th>
              <th>${App.I18n.t('common.date', 'Date')}</th>
              <th>${App.I18n.t('common.dueDate', 'Due Date')}</th>
              <th style="text-align:right;">${App.I18n.t('common.total', 'Total')}</th>
              <th style="text-align:center;">${App.I18n.t('common.status', 'Status')}</th>
              <th style="text-align:center;">${App.I18n.t('documents.payment', 'Payment')}</th>
              <th style="text-align:center;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${activeDocs.length > 0 ? activeDocs.map(d => {
              const cust = App.Data.customers.find(c => c.id === d.customerId);
              const isInv = d.type === 'invoice';
              const icon = isInv ? '🧾' : '📦';
              const esc = App.Utils.escapeHtml;
              const canFinalize = isInv && !d.isFinalized;
              const canEdit = !d.isFinalized;
              const canPay = isInv && (d.paidAmount || 0) < (d.grossTotal || 0);

              return `
                <tr>
                  <td><span title="${d.type}">${icon}</span></td>
                  <td>
                    <strong>${esc(d.docNumber || d.id)}</strong>
                  </td>
                  <td>${cust ? esc(cust.company) : '-'}</td>
                  <td>${App.Utils.formatDate(d.date)}</td>
                  <td>${formatDueDate(d)}</td>
                  <td style="text-align:right;">${isInv ? App.Utils.formatCurrency(d.grossTotal || d.total) : '-'}</td>
                  <td style="text-align:center;">${getFinalizationBadge(d)}</td>
                  <td style="text-align:center;">${getPaymentStatus(d)}</td>
                  <td style="text-align:center; white-space:nowrap;">
                    <button class="btn btn-ghost btn-doc-view" data-id="${d.id}" title="${App.I18n.t('common.viewPrint', 'View/Print')}" aria-label="View document">👁️</button>
                    ${canEdit ? `<button class="btn btn-ghost btn-doc-edit" data-id="${d.id}" title="${App.I18n.t('common.edit', 'Edit')}" aria-label="Edit document">✏️</button>` : ''}
                    ${canFinalize ? `<button class="btn btn-ghost btn-doc-finalize" data-id="${d.id}" title="${App.I18n.t('documents.finalize', 'Finalize Invoice')}" aria-label="Finalize invoice">✅</button>` : ''}
                    ${canPay ? `<button class="btn btn-ghost btn-doc-pay" data-id="${d.id}" title="${App.I18n.t('common.recordPayment', 'Record Payment')}" aria-label="Record payment">💰</button>` : ''}
                    ${isInv ? `<button class="btn btn-ghost btn-doc-history" data-id="${d.id}" title="${App.I18n.t('common.paymentHistory', 'Payment History')}" aria-label="Payment history">📋</button>` : ''}
                    ${isInv ? `<button class="btn btn-ghost btn-doc-email" data-id="${d.id}" title="${App.I18n.t('emailTemplate.generateEmail', 'Email Text (Customer)')}" aria-label="Generate customer email">📧</button>` : ''}
                    <button class="btn btn-ghost btn-doc-delete" data-id="${d.id}" title="${App.I18n.t('common.delete', 'Delete')}" aria-label="Delete document">🗑️</button>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted);">No documents</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-invoice')?.addEventListener('click', () => this.openCreateModal('invoice'));
    document.getElementById('btn-add-delivery')?.addEventListener('click', () => this.openCreateModal('delivery'));
    document.getElementById('btn-export-docs')?.addEventListener('click', () => this.exportDocuments());

    root.querySelectorAll('.btn-doc-view').forEach(btn => {
      btn.addEventListener('click', () => this.printDocument(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-pay').forEach(btn => {
      btn.addEventListener('click', () => this.openPaymentModal(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-history').forEach(btn => {
      btn.addEventListener('click', () => this.openPaymentHistory(btn.getAttribute('data-id')));
    });

    // Generate customer email
    root.querySelectorAll('.btn-doc-email').forEach(btn => {
      btn.addEventListener('click', () => this.generateCustomerEmail(btn.getAttribute('data-id')));
    });

    // Edit document
    root.querySelectorAll('.btn-doc-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editDocument(btn.getAttribute('data-id')));
    });

    // Finalize invoice
    root.querySelectorAll('.btn-doc-finalize').forEach(btn => {
      btn.addEventListener('click', () => this.finalizeInvoice(btn.getAttribute('data-id')));
    });

    root.querySelectorAll('.btn-doc-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteDocument(btn.getAttribute('data-id')));
    });

    // View trash
    document.getElementById('btn-view-trash')?.addEventListener('click', () => this.openTrashModal());

    // Search functionality
    const searchInput = document.getElementById('doc-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = root.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = query === '' || text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  deleteDocument(id) {
    const documents = App.Data.documents || [];
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const cust = (App.Data.customers || []).find(c => c.id === doc.customerId);
    const isInvoice = doc.type === 'invoice';
    const hasPaidAmount = isInvoice && (doc.paidAmount || 0) > 0;

    // Warn if invoice has payments
    if (hasPaidAmount) {
      App.UI.Modal.open(App.I18n.t('common.documentHasPayments', 'Document Has Payments'), `
        <div style="color:#f59e0b;">
          <p><strong>⚠️ This invoice has recorded payments</strong></p>
          <p style="font-size:12px; margin-top:8px;">
            Paid: ${App.Utils.formatCurrency(doc.paidAmount)}<br/>
            Deleting will remove payment history.
          </p>
        </div>
      `, [
        { text: 'Cancel', variant: 'ghost', onClick: () => {} },
        {
          text: 'Delete Anyway',
          variant: 'primary',
          onClick: () => this._performDocDelete(id, doc, cust)
        }
      ]);
      return;
    }

    App.UI.Modal.open(App.I18n.t('common.deleteDocument', 'Delete Document'), `
      <div>
        <p>Are you sure you want to delete <strong>${doc.docNumber}</strong>?</p>
        <div style="font-size:12px; color:var(--color-text-muted); margin-top:8px;">
          <p>Type: ${isInvoice ? 'Invoice' : 'Delivery Note'}</p>
          <p>Customer: ${cust ? cust.company : '-'}</p>
          ${isInvoice ? `<p>Total: ${App.Utils.formatCurrency(doc.grossTotal)}</p>` : ''}
        </div>
      </div>
    `, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Delete',
        variant: 'primary',
        onClick: () => this._performDocDelete(id, doc, cust)
      }
    ]);
  },

  _performDocDelete(id, doc, cust) {
    // Soft delete - mark as deleted instead of removing
    doc.isDeleted = true;
    doc.deletedDate = new Date().toISOString();
    doc.deletedBy = App.Services.Auth?.currentUser?.id || 'system';
    App.DB.save();

    // Recompute order status if linked
    if (App.Services.Automation && doc.orderId) {
      App.Services.Automation.recomputeOrderStatus(doc.orderId);
    }

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('delete', 'document', id, {
        name: doc.docNumber,
        type: doc.type,
        customer: cust?.company,
        action: 'moved_to_trash'
      });
    }

    App.UI.Toast.show(App.I18n.t('documents.movedToTrash', 'Document moved to trash'));
    App.Core.Router.navigate('documents');
  },

  /**
   * Open trash modal to view and restore deleted documents
   */
  openTrashModal() {
    const deletedDocs = (App.Data.documents || []).filter(d => d.isDeleted);

    if (deletedDocs.length === 0) {
      App.UI.Toast.show(App.I18n.t('documents.trashEmpty', 'Trash is empty'));
      return;
    }

    const rows = deletedDocs.map(d => {
      const cust = App.Data.customers.find(c => c.id === d.customerId);
      const deletedDate = d.deletedDate ? new Date(d.deletedDate).toLocaleDateString() : '-';
      return `
        <tr>
          <td>${d.type === 'invoice' ? '🧾' : '📦'} ${d.docNumber}</td>
          <td>${cust ? cust.company : '-'}</td>
          <td>${deletedDate}</td>
          <td style="text-align:center;">
            <button class="btn btn-ghost btn-restore-doc" data-id="${d.id}" title="${App.I18n.t('documents.restore', 'Restore')}">♻️</button>
            <button class="btn btn-ghost btn-perma-delete" data-id="${d.id}" title="${App.I18n.t('documents.permanentDelete', 'Delete Permanently')}" style="color:var(--color-danger);">❌</button>
          </td>
        </tr>
      `;
    }).join('');

    const body = `
      <div style="max-height:400px; overflow-y:auto;">
        <table class="table" style="font-size:13px;">
          <thead>
            <tr>
              <th>${App.I18n.t('documents.document', 'Document')}</th>
              <th>${App.I18n.t('documents.customer', 'Customer')}</th>
              <th>${App.I18n.t('documents.deletedDate', 'Deleted')}</th>
              <th style="text-align:center;">${App.I18n.t('common.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="font-size:11px; color:var(--color-text-muted); margin-top:12px;">
        ${App.I18n.t('documents.trashHint', 'Restore documents to recover them, or delete permanently to free space.')}
      </p>
    `;

    App.UI.Modal.open(App.I18n.t('documents.trashTitle', 'Deleted Documents'), body, [
      { text: App.I18n.t('common.close', 'Close'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('documents.emptyTrash', 'Empty Trash'),
        variant: 'primary',
        onClick: () => {
          this.emptyTrash();
        }
      }
    ]);

    // Wire up restore and permanent delete buttons
    setTimeout(() => {
      document.querySelectorAll('.btn-restore-doc').forEach(btn => {
        btn.onclick = () => {
          this.restoreDocument(btn.getAttribute('data-id'));
          App.UI.Modal.close();
        };
      });
      document.querySelectorAll('.btn-perma-delete').forEach(btn => {
        btn.onclick = () => {
          this.permanentlyDeleteDocument(btn.getAttribute('data-id'));
          App.UI.Modal.close();
        };
      });
    }, 0);
  },

  /**
   * Restore a document from trash
   */
  restoreDocument(id) {
    const doc = App.Data.documents.find(d => d.id === id);
    if (!doc) return;

    doc.isDeleted = false;
    delete doc.deletedDate;
    delete doc.deletedBy;
    App.DB.save();

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('restore', 'document', id, {
        name: doc.docNumber,
        type: doc.type
      });
    }

    App.UI.Toast.show(App.I18n.t('documents.restored', 'Document restored'));
    App.Core.Router.navigate('documents');
  },

  /**
   * Permanently delete a document
   */
  permanentlyDeleteDocument(id) {
    const doc = App.Data.documents.find(d => d.id === id);
    if (!doc) return;

    App.UI.Modal.open(App.I18n.t('documents.confirmPermanentDelete', 'Confirm Permanent Delete'), `
      <div style="color:var(--color-danger);">
        <p><strong>⚠️ ${App.I18n.t('documents.cannotUndo', 'This action cannot be undone!')}</strong></p>
        <p style="margin-top:8px;">
          ${App.I18n.t('documents.permanentDeleteDesc', 'This will permanently remove the document from the system.')}
        </p>
        <p style="margin-top:8px; font-size:12px;">
          ${App.I18n.t('documents.document', 'Document')}: <strong>${doc.docNumber}</strong>
        </p>
      </div>
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('documents.deletePermanently', 'Delete Permanently'),
        variant: 'primary',
        onClick: () => {
          App.Data.documents = App.Data.documents.filter(d => d.id !== id);
          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'document', id, {
              name: doc.docNumber,
              type: doc.type,
              action: 'permanent_delete'
            });
          }

          App.UI.Toast.show(App.I18n.t('documents.permanentlyDeleted', 'Document permanently deleted'));
          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  /**
   * Empty all documents from trash
   */
  emptyTrash() {
    const deletedDocs = App.Data.documents.filter(d => d.isDeleted);
    if (deletedDocs.length === 0) return;

    App.UI.Modal.open(App.I18n.t('documents.confirmEmptyTrash', 'Empty Trash'), `
      <div style="color:var(--color-danger);">
        <p><strong>⚠️ ${App.I18n.t('documents.cannotUndo', 'This action cannot be undone!')}</strong></p>
        <p style="margin-top:8px;">
          ${App.I18n.t('documents.emptyTrashDesc', 'This will permanently delete all')} <strong>${deletedDocs.length}</strong> ${App.I18n.t('documents.documentsInTrash', 'documents in trash')}.
        </p>
      </div>
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('documents.emptyTrash', 'Empty Trash'),
        variant: 'primary',
        onClick: () => {
          App.Data.documents = App.Data.documents.filter(d => !d.isDeleted);
          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('delete', 'document', null, {
              action: 'empty_trash',
              count: deletedDocs.length
            });
          }

          App.UI.Toast.show(App.I18n.t('documents.trashEmptied', 'Trash emptied'));
          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  /**
   * Edit document (only for non-finalized documents)
   */
  editDocument(id) {
    const doc = App.Data.documents.find(d => d.id === id);
    if (!doc) return;

    if (doc.isFinalized) {
      App.UI.Toast.show(App.I18n.t('documents.cannotEditFinalized', 'Cannot edit finalized documents'), 'warning');
      return;
    }

    // Simple edit modal for basic fields
    const body = `
      <div class="grid" style="gap:12px;">
        <div>
          <label class="field-label">${App.I18n.t('documents.docNumber', 'Document Number')}</label>
          <input id="edit-doc-number" class="input" value="${doc.docNumber || ''}" />
        </div>
        <div>
          <label class="field-label">${App.I18n.t('documents.date', 'Date')}</label>
          <input id="edit-doc-date" type="date" class="input" value="${(doc.date || '').split('T')[0]}" />
        </div>
        ${doc.type === 'invoice' ? `
        <div>
          <label class="field-label">${App.I18n.t('documents.dueDate', 'Due Date')}</label>
          <input id="edit-doc-due" type="date" class="input" value="${(doc.dueDate || '').split('T')[0]}" />
        </div>
        ` : ''}
        <div>
          <label class="field-label">${App.I18n.t('documents.notes', 'Notes')}</label>
          <textarea id="edit-doc-notes" class="input" rows="3">${doc.notes || ''}</textarea>
        </div>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('documents.editDocument', 'Edit Document'), body, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('common.save', 'Save'),
        variant: 'primary',
        onClick: () => {
          doc.docNumber = document.getElementById('edit-doc-number').value.trim() || doc.docNumber;
          doc.date = document.getElementById('edit-doc-date').value || doc.date;
          if (doc.type === 'invoice') {
            doc.dueDate = document.getElementById('edit-doc-due')?.value || doc.dueDate;
          }
          doc.notes = document.getElementById('edit-doc-notes').value.trim();
          doc.modifiedDate = new Date().toISOString();

          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'document', id, {
              name: doc.docNumber,
              type: doc.type
            });
          }

          App.UI.Toast.show(App.I18n.t('documents.updated', 'Document updated'));
          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  /**
   * Finalize an invoice - makes it immutable (GoBD compliance)
   */
  finalizeInvoice(docId) {
    const doc = App.Data.documents.find(d => d.id === docId);
    if (!doc || doc.type !== 'invoice') return;

    if (doc.isFinalized) {
      App.UI.Toast.show(App.I18n.t('documents.alreadyFinalized', 'Invoice is already finalized'), 'warning');
      return;
    }

    const cust = (App.Data.customers || []).find(c => c.id === doc.customerId);

    App.UI.Modal.open(App.I18n.t('documents.finalizeTitle', 'Finalize Invoice'), `
      <div>
        <p><strong>⚠️ ${App.I18n.t('documents.finalizeWarning', 'This action cannot be undone!')}</strong></p>
        <p style="margin-top:8px; font-size:13px;">
          ${App.I18n.t('documents.finalizeDesc', 'Finalizing this invoice will lock it permanently. You will not be able to edit or delete it afterwards.')}
        </p>
        <div style="margin-top:12px; padding:12px; background:var(--color-bg); border-radius:8px; font-size:12px;">
          <p><strong>${App.I18n.t('documents.invoice', 'Invoice')}:</strong> ${doc.docNumber}</p>
          <p><strong>${App.I18n.t('documents.customer', 'Customer')}:</strong> ${cust ? cust.company : '-'}</p>
          <p><strong>${App.I18n.t('documents.total', 'Total')}:</strong> ${App.Utils.formatCurrency(doc.grossTotal)}</p>
        </div>
      </div>
    `, [
      { text: App.I18n.t('common.cancel', 'Cancel'), variant: 'ghost', onClick: () => {} },
      {
        text: App.I18n.t('documents.finalize', 'Finalize'),
        variant: 'primary',
        onClick: () => {
          // Set finalization fields
          doc.isFinalized = true;
          doc.finalizedDate = new Date().toISOString();
          doc.finalizedBy = App.Data.Config?.currentUserId || 'system';
          doc.modifiedDate = new Date().toISOString();

          App.DB.save();

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('finalize', 'document', docId, {
              name: doc.docNumber,
              type: doc.type,
              customer: cust?.company,
              amount: doc.grossTotal
            });
          }

          App.UI.Toast.show(App.I18n.t('documents.finalized', 'Invoice finalized successfully'), 'success');
          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  openPaymentModal(docId) {
    const doc = App.Data.documents.find(d => d.id === docId);
    if (!doc) return;

    const remaining = (doc.grossTotal || 0) - (doc.paidAmount || 0);
    const today = new Date().toISOString().split('T')[0];

    const body = `
      <div>
        <p style="margin-bottom:12px;">
          Invoice: <strong>${doc.docNumber}</strong><br/>
          Total: <strong>${App.Utils.formatCurrency(doc.grossTotal)}</strong><br/>
          Paid: <strong>${App.Utils.formatCurrency(doc.paidAmount || 0)}</strong><br/>
          Remaining: <strong style="color:#dc2626;">${App.Utils.formatCurrency(remaining)}</strong>
        </p>

        <label class="field-label">Payment Amount (€)*</label>
        <input id="pay-amount" class="input" type="number" min="0.01" step="0.01" value="${remaining.toFixed(2)}" />

        <label class="field-label" style="margin-top:8px;">Payment Date</label>
        <input id="pay-date" class="input" type="date" value="${today}" />

        <label class="field-label" style="margin-top:8px;">Payment Method</label>
        <select id="pay-method" class="input">
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="cheque">Cheque</option>
          <option value="paypal">PayPal</option>
        </select>

        <label class="field-label" style="margin-top:8px;">Reference</label>
        <input id="pay-ref" class="input" placeholder="Transaction ID, cheque number, etc." />

        <label class="field-label" style="margin-top:8px;">Notes</label>
        <textarea id="pay-notes" class="input" rows="2"></textarea>
      </div>
    `;

    App.UI.Modal.open(App.I18n.t('common.recordPaymentTitle', 'Record Payment'), body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Save Payment',
        variant: 'primary',
        onClick: () => {
          const amount = parseFloat(document.getElementById('pay-amount').value);
          if (!amount || amount <= 0) {
            App.UI.Toast.show('Please enter a valid amount');
            return false;
          }

          if (amount > remaining + 0.01) {
            App.UI.Toast.show('Amount exceeds remaining balance');
            return false;
          }

          const payment = {
            id: App.Utils.generateId('pay'),
            amount: amount,
            date: document.getElementById('pay-date').value,
            method: document.getElementById('pay-method').value,
            reference: document.getElementById('pay-ref').value.trim() || null,
            notes: document.getElementById('pay-notes').value.trim() || null,
            recordedAt: new Date().toISOString(),
            recordedBy: App.Services.Auth.currentUser?.id
          };

          if (!doc.payments) doc.payments = [];
          doc.payments.push(payment);
          doc.paidAmount = (doc.paidAmount || 0) + amount;

          App.DB.save();
          App.UI.Toast.show(`Payment of ${App.Utils.formatCurrency(amount)} recorded`);

          // Recompute order status based on payment
          if (App.Services.Automation && doc.orderId) {
            App.Services.Automation.recomputeOrderStatus(doc.orderId);
          }

          // Log activity
          if (App.Services.ActivityLog) {
            App.Services.ActivityLog.log('update', 'document', doc.id, {
              name: doc.docNumber,
              action: 'payment_recorded',
              amount: amount,
              method: payment.method
            });
          }

          App.Core.Router.navigate('documents');
        }
      }
    ]);
  },

  openPaymentHistory(docId) {
    const doc = App.Data.documents.find(d => d.id === docId);
    if (!doc) return;

    const payments = doc.payments || [];
    const remaining = (doc.grossTotal || 0) - (doc.paidAmount || 0);

    const paymentRows = payments.length > 0 ? payments.map(p => `
      <tr>
        <td>${p.date || '-'}</td>
        <td>${App.Utils.formatCurrency(p.amount)}</td>
        <td>${p.method || '-'}</td>
        <td>${p.reference || '-'}</td>
      </tr>
    `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No payments recorded</td></tr>';

    const body = `
      <div>
        <div style="margin-bottom:12px; padding:12px; background:var(--color-bg); border-radius:4px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Total:</span>
            <strong>${App.Utils.formatCurrency(doc.grossTotal || 0)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Paid:</span>
            <strong style="color:#16a34a;">${App.Utils.formatCurrency(doc.paidAmount || 0)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid var(--color-border); padding-top:4px;">
            <span>Remaining:</span>
            <strong style="color:${remaining > 0 ? '#dc2626' : '#16a34a'};">${App.Utils.formatCurrency(remaining)}</strong>
          </div>
        </div>

        <table class="table" style="font-size:12px;">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>
    `;

    App.UI.Modal.open(`Payment History - ${doc.docNumber}`, body, [
      { text: 'Close', variant: 'ghost', onClick: () => {} }
    ]);
  },

  openCreateModal(type) {
    const custOptions = (App.Data.customers || [])
      .map(c => `<option value="${c.id}">${c.company}</option>`)
      .join('');
    const orderOptions = (App.Data.orders || [])
      .filter(o => o.status !== 'draft')
      .map(o => `<option value="${o.id}">${o.orderId} (${App.Utils.formatDate(o.date)})</option>`)
      .join('');

    const title = type === 'delivery' ? 'Create Delivery Note' : 'Create Invoice';
    const body = `
      <div>
        <label class="field-label">Source</label>
        <select id="doc-src" class="input">
          <option value="order">From Order</option>
          <option value="manual">Manual (Blank)</option>
        </select>

        <div id="doc-order-section" style="margin-top:8px;">
          <label class="field-label">Select Order</label>
          <select id="doc-order" class="input">${orderOptions}</select>
        </div>

        <div id="doc-manual-section" style="margin-top:8px; display:none;">
          <label class="field-label">Customer</label>
          <select id="doc-cust" class="input">${custOptions}</select>
          <p style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Manual creation creates a blank document draft.</p>
        </div>
      </div>
    `;

    App.UI.Modal.open(title, body, [
      { text: 'Cancel', variant: 'ghost', onClick: () => {} },
      {
        text: 'Generate',
        variant: 'primary',
        onClick: () => {
          const source = document.getElementById('doc-src').value;
          if (source === 'order') {
            const ordId = document.getElementById('doc-order').value;
            if(!ordId) return false;
            this.generateFromOrder(ordId, type);
          } else {
            const custId = document.getElementById('doc-cust').value;
            if(!custId) return false;
            this.createManual(custId, type);
          }
        }
      }
    ]);

    setTimeout(() => {
      const src = document.getElementById('doc-src');
      const orderSec = document.getElementById('doc-order-section');
      const manualSec = document.getElementById('doc-manual-section');
      src.onchange = () => {
        if (src.value === 'order') {
          orderSec.style.display = '';
          manualSec.style.display = 'none';
        } else {
          orderSec.style.display = 'none';
          manualSec.style.display = '';
        }
      };
    }, 0);
  },

  calculateDueDate(invoiceDate, paymentTerms) {
    const date = new Date(invoiceDate);
    let days = 30;

    if (paymentTerms) {
      const match = paymentTerms.match(/Net\s*(\d+)/i);
      if (match) {
        days = parseInt(match[1]);
      } else if (paymentTerms.toLowerCase().includes('cod') || paymentTerms.toLowerCase().includes('prepaid')) {
        days = 0;
      }
    }

    date.setDate(date.getDate() + days);
    return date.toISOString();
  },

  generateFromOrder(orderId, type) {
    const o = App.Data.orders.find(x => x.id === orderId);
    if (!o) {
      App.UI.Toast.show('Order not found');
      return;
    }

    const cust = App.Data.customers.find(c => c.id === o.custId);
    const existingDocs = App.Data.documents || [];

    // Document creation guardrails
    const errors = [];

    // Strict LS to Invoice linking - invoice requires delivery note
    let refDeliveryId = null;
    if (type === 'invoice') {
      const deliveryNotes = existingDocs.filter(d => d.orderId === orderId && d.type === 'delivery');

      if (deliveryNotes.length === 0) {
        // Show modal to create delivery note first
        App.UI.Modal.open(App.I18n.t('common.deliveryNoteRequired', 'Delivery Note Required'), `
          <div>
            <div style="color:#f59e0b; margin-bottom:12px;">
              <strong>⚠️ Cannot create invoice without delivery note</strong>
            </div>
            <p style="font-size:13px; margin-bottom:12px;">
              An invoice must be linked to a delivery note for proper document tracking.
              Please create a delivery note for this order first.
            </p>
            <p style="font-size:12px; color:var(--color-text-muted);">
              Order: <strong>${o.orderId}</strong>
            </p>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Create Delivery Note First',
            variant: 'primary',
            onClick: () => {
              this.generateFromOrder(orderId, 'delivery');
            }
          }
        ]);
        return;
      }

      // If multiple delivery notes, let user select which one to link
      if (deliveryNotes.length === 1) {
        refDeliveryId = deliveryNotes[0].id;
      } else {
        // Show selection modal for multiple delivery notes
        const dnOptions = deliveryNotes.map(dn =>
          `<option value="${dn.id}">${dn.docNumber} (${dn.date?.split('T')[0] || '-'})</option>`
        ).join('');

        App.UI.Modal.open(App.I18n.t('common.selectDeliveryNote', 'Select Delivery Note'), `
          <div>
            <p style="font-size:13px; margin-bottom:12px;">
              Multiple delivery notes exist for this order. Select which one to link to the invoice:
            </p>
            <label class="field-label">Delivery Note</label>
            <select id="select-delivery-note" class="input">
              ${dnOptions}
            </select>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Continue',
            variant: 'primary',
            onClick: () => {
              const selectedDnId = document.getElementById('select-delivery-note').value;
              this._createInvoiceWithDeliveryRef(orderId, selectedDnId);
            }
          }
        ]);
        return;
      }
    }

    // Check if delivery note already exists for this order (warn on duplicate)
    if (type === 'delivery') {
      const existingDelivery = existingDocs.find(d => d.orderId === orderId && d.type === 'delivery');
      if (existingDelivery) {
        App.UI.Modal.open(App.I18n.t('common.deliveryNoteExists', 'Delivery Note Exists'), `
          <div>
            <p style="margin-bottom:12px;">
              A delivery note (<strong>${existingDelivery.docNumber}</strong>) already exists for this order.
            </p>
            <p style="font-size:12px; color:var(--color-text-muted);">
              Do you want to create another delivery note? (Partial shipment)
            </p>
          </div>
        `, [
          { text: 'Cancel', variant: 'ghost', onClick: () => {} },
          {
            text: 'Create Another',
            variant: 'primary',
            onClick: () => {
              this._createDocument(orderId, type, null);
            }
          }
        ]);
        return;
      }
    }

    // Continue with document creation
    this._createDocument(orderId, type, refDeliveryId);
  },

  /**
   * Internal method to create invoice with delivery reference (for multi-DN selection)
   */
  _createInvoiceWithDeliveryRef(orderId, refDeliveryId) {
    this._createDocument(orderId, 'invoice', refDeliveryId);
  },

  /**
   * Internal method to create document with all validations
   */
  _createDocument(orderId, type, refDeliveryId) {
    const o = App.Data.orders.find(x => x.id === orderId);
    if (!o) return;

    const cust = App.Data.customers.find(c => c.id === o.custId);
    const errors = [];

    if (!cust) {
      errors.push('Customer not found for this order');
    } else {
      // Check for required addresses
      const addresses = cust.addresses || [];
      const hasBilling = addresses.some(a => a.role === 'billing' || addresses.length > 0);
      const hasShipping = addresses.some(a => a.role === 'shipping' || addresses.length > 0);

      if (addresses.length === 0) {
        errors.push('Customer has no addresses configured');
      } else {
        if (!hasBilling) errors.push('Customer needs a billing address');
        if (!hasShipping && type === 'delivery') errors.push('Customer needs a shipping address for delivery notes');
      }

      // Check VAT number for invoices (optional but recommended)
      if (type === 'invoice' && !cust.vatNumber) {
        // Just a warning, not blocking
      }
    }

    // Check order has items
    if (!o.items || o.items.length === 0) {
      errors.push('Order has no line items');
    }

    // Check products exist
    if (o.items) {
      const missingProducts = o.items.filter(i => {
        const p = App.Data.products.find(p => p.id === i.productId);
        return !p;
      });
      if (missingProducts.length > 0) {
        errors.push(`${missingProducts.length} product(s) not found in order`);
      }
    }

    // If errors, show modal with issues
    if (errors.length > 0) {
      App.UI.Modal.open(App.I18n.t('common.cannotCreateDocument', 'Cannot Create Document'), `
        <div style="color:#dc2626;">
          <p style="font-weight:600; margin-bottom:8px;">Please fix the following issues:</p>
          <ul style="margin:0; padding-left:20px;">
            ${errors.map(e => `<li style="margin-bottom:4px;">${e}</li>`).join('')}
          </ul>
        </div>
        <p style="font-size:12px; color:var(--color-text-muted); margin-top:12px;">
          Go to Customer or Order settings to add missing data.
        </p>
      `, [
        { text: 'Close', variant: 'ghost', onClick: () => {} }
      ]);
      return;
    }

    const docNum = type === 'delivery'
      ? App.Services.NumberSequence.nextDeliveryNumber()
      : App.Services.NumberSequence.nextInvoiceNumber();

    const billAddr = cust.addresses.find(a => a.id === o.billingAddressId) || cust.addresses.find(a => a.role === 'billing') || cust.addresses[0];
    const shipAddr = cust.addresses.find(a => a.id === o.shippingAddressId) || cust.addresses.find(a => a.role === 'shipping') || cust.addresses[0];

    const defaultVatRate = App.Data.config?.defaultVatRate || 0.2;

    const items = o.items.map(i => {
      const p = App.Data.products.find(p => p.id === i.productId);
      const lineNet = i.lineNet || (i.qty * i.unitPrice);
      return {
        productId: i.productId,
        articleNumber: p ? (p.internalArticleNumber || p.sku) : '-',
        description: p ? (p.nameDE || p.nameEN) : 'Unknown Product',
        qty: i.qty,
        unit: p ? p.unit : 'Stk',
        unitPrice: i.unitPrice,
        vatRate: defaultVatRate,
        lineNet: lineNet,
        lineVat: lineNet * defaultVatRate,
        lineTotal: lineNet * (1 + defaultVatRate)
      };
    });

    const subNet = items.reduce((sum, i) => sum + i.lineNet, 0);
    const vatAmt = subNet * defaultVatRate;
    const total = subNet + vatAmt;
    const invoiceDate = new Date().toISOString();

    // Auto-select language based on customer preference or country
    let docLang = 'en';
    if (cust.preferredLang) {
      docLang = cust.preferredLang;
    } else {
      // Auto-detect based on country
      const custCountry = (billAddr?.country || '').toLowerCase();
      if (['germany', 'deutschland', 'austria', 'österreich', 'switzerland', 'schweiz', 'de', 'at', 'ch'].some(c => custCountry.includes(c))) {
        docLang = 'de';
      } else if (['romania', 'rumänien', 'ro'].some(c => custCountry.includes(c))) {
        docLang = 'ro';
      }
    }

    const doc = {
      id: App.Utils.generateId('d'),
      type: type,
      docNumber: docNum,
      date: invoiceDate,
      dueDate: type === 'invoice' ? this.calculateDueDate(invoiceDate, cust.paymentTerms) : null,
      customerId: cust.id,
      billingAddressId: billAddr ? billAddr.id : null,
      shippingAddressId: shipAddr ? shipAddr.id : null,
      orderId: o.id,
      refDeliveryId: refDeliveryId, // Link invoice to delivery note
      ref: o.customerReference,
      paymentTerms: cust.paymentTerms,
      deliveryTerms: cust.deliveryTerms,
      language: docLang, // Auto-selected document language
      items: items,
      netTotal: subNet,
      vatSummary: [{ rate: defaultVatRate, base: subNet, amount: vatAmt }],
      grossTotal: total,
      paidAmount: 0,
      payments: [],
      status: 'Draft'
    };

    App.Data.documents.push(doc);
    App.DB.save();

    // Recompute order status based on new document
    if (App.Services.Automation && doc.orderId) {
      App.Services.Automation.recomputeOrderStatus(doc.orderId);
    }

    App.UI.Toast.show(`${type === 'invoice' ? 'Invoice' : 'Delivery Note'} generated`);
    App.Core.Router.navigate('documents');
  },

  createManual(custId, type) {
    App.UI.Toast.show("Manual creation - use Order workflow for now");
  },

  printDocument(id) {
    const d = App.Data.documents.find(x => x.id === id);
    if (!d) return;
    const cust = App.Data.customers.find(c => c.id === d.customerId);
    const conf = App.Data.config || {};

    const billAddr = (cust.addresses || []).find(a => a.id === d.billingAddressId) || (cust.addresses || [])[0] || {};
    const shipAddr = (cust.addresses || []).find(a => a.id === d.shippingAddressId) || billAddr;

    const isInv = d.type === 'invoice';
    const docLang = d.language || 'en';

    // Language-specific labels
    const labels = {
      en: {
        invoiceTitle: 'Invoice',
        deliveryTitle: 'Delivery Note',
        billingAddr: 'Billing Address',
        shippingAddr: 'Shipping Address',
        artNo: 'Art. No.',
        description: 'Description',
        qty: 'Qty',
        unit: 'Unit',
        price: 'Price',
        total: 'Total',
        net: 'Net',
        vat: 'VAT',
        terms: 'Terms',
        delivery: 'Delivery',
        bank: 'Bank',
        due: 'Due',
        paid: 'Paid',
        balance: 'Balance Due'
      },
      de: {
        invoiceTitle: 'Rechnung',
        deliveryTitle: 'Lieferschein',
        billingAddr: 'Rechnungsadresse',
        shippingAddr: 'Lieferadresse',
        artNo: 'Art. Nr.',
        description: 'Beschreibung',
        qty: 'Menge',
        unit: 'Einheit',
        price: 'Preis',
        total: 'Gesamt',
        net: 'Netto',
        vat: 'MwSt',
        terms: 'Zahlungsbed.',
        delivery: 'Lieferung',
        bank: 'Bank',
        due: 'Fällig',
        paid: 'Bezahlt',
        balance: 'Offener Betrag'
      },
      ro: {
        invoiceTitle: 'Factură',
        deliveryTitle: 'Aviz de Livrare',
        billingAddr: 'Adresa de Facturare',
        shippingAddr: 'Adresa de Livrare',
        artNo: 'Nr. Art.',
        description: 'Descriere',
        qty: 'Cant.',
        unit: 'UM',
        price: 'Preț',
        total: 'Total',
        net: 'Net',
        vat: 'TVA',
        terms: 'Termeni',
        delivery: 'Livrare',
        bank: 'Bancă',
        due: 'Scadent',
        paid: 'Plătit',
        balance: 'De plată'
      }
    };

    const l = labels[docLang] || labels.en;
    const title = isInv ? l.invoiceTitle : l.deliveryTitle;

    const rows = d.items.map(i => `
      <tr>
        <td>${i.articleNumber || ''}</td>
        <td>${i.description || ''}</td>
        <td style="text-align:right">${i.qty}</td>
        <td>${i.unit || ''}</td>
        ${isInv ? `<td style="text-align:right">${App.Utils.formatCurrency(i.unitPrice)}</td>` : ''}
        ${isInv ? `<td style="text-align:right">${App.Utils.formatCurrency(i.lineNet)}</td>` : ''}
      </tr>
    `).join('');

    let totalsHtml = '';
    if (isInv) {
      const remaining = (d.grossTotal || 0) - (d.paidAmount || 0);
      totalsHtml = `
        <div class="totals-block">
          <div class="row"><span class="label">${l.net}:</span> <span class="val">${App.Utils.formatCurrency(d.netTotal)}</span></div>
          <div class="row"><span class="label">${l.vat} (20%):</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal - d.netTotal)}</span></div>
          <div class="row bold"><span class="label">${l.total}:</span> <span class="val">${App.Utils.formatCurrency(d.grossTotal)}</span></div>
          ${d.paidAmount > 0 ? `<div class="row" style="color:#16a34a;"><span class="label">${l.paid}:</span> <span class="val">-${App.Utils.formatCurrency(d.paidAmount)}</span></div>` : ''}
          ${remaining > 0 ? `<div class="row" style="color:#dc2626;"><span class="label">${l.balance}:</span> <span class="val">${App.Utils.formatCurrency(remaining)}</span></div>` : ''}
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${d.docNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; font-size: 12px; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .company-info { font-size: 11px; color: #666; }
          .doc-title { font-size: 24px; font-weight: bold; color: #000; text-transform: uppercase; }
          .doc-meta { text-align: right; margin-top: 10px; font-size: 13px; }

          .addresses { display: flex; gap: 40px; margin-bottom: 40px; }
          .addr-box { flex: 1; border: 1px solid #eee; padding: 15px; border-radius: 4px; }
          .addr-title { font-weight: bold; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; color: #888; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; border-bottom: 2px solid #333; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #eee; padding: 8px; vertical-align: top; }

          .totals-block { width: 300px; margin-left: auto; margin-top: 20px; }
          .totals-block .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals-block .bold { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 5px; }

          .footer { margin-top: 60px; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; }

          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-info">
              <strong>${conf.companyName || 'MicroOps Global'}</strong><br/>
              Tax ID: ${cust.vatNumber || '-'}<br/>
              Email: info@microops.com
            </div>
          </div>
          <div>
            <div class="doc-title">${title}</div>
            <div class="doc-meta">
              <strong>No:</strong> ${d.docNumber}<br/>
              <strong>Date:</strong> ${d.date.split('T')[0]}<br/>
              ${isInv && d.dueDate ? `<strong>Due:</strong> ${d.dueDate.split('T')[0]}<br/>` : ''}
              <strong>Ref:</strong> ${d.ref || '-'}
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="addr-box">
            <div class="addr-title">${l.billingAddr}</div>
            <strong>${cust.company}</strong><br/>
            ${billAddr.street || ''}<br/>
            ${billAddr.zip || ''} ${billAddr.city || ''}<br/>
            ${billAddr.country || ''}<br/>
            ${cust.vatNumber ? 'VAT: ' + cust.vatNumber : ''}
          </div>
          <div class="addr-box">
            <div class="addr-title">${l.shippingAddr}</div>
            <strong>${cust.company}</strong><br/>
            ${shipAddr.street || ''}<br/>
            ${shipAddr.zip || ''} ${shipAddr.city || ''}<br/>
            ${shipAddr.country || ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="15%">${l.artNo}</th>
              <th width="40%">${l.description}</th>
              <th width="10%" style="text-align:right">${l.qty}</th>
              <th width="10%">${l.unit}</th>
              ${isInv ? `<th width="12%" style="text-align:right">${l.price}</th>` : ''}
              ${isInv ? `<th width="13%" style="text-align:right">${l.total}</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${totalsHtml}

        <div class="footer">
          <div>
            <strong>${l.terms}:</strong> ${d.paymentTerms || '-'}<br/>
            <strong>${l.delivery}:</strong> ${d.deliveryTerms || '-'}
          </div>
          <div>
            <strong>${l.bank}:</strong> ${conf.bankName || '-'}<br/>
            <strong>IBAN:</strong> ${conf.iban || '-'}
          </div>
          <div>
            MicroOps ERP Generated
          </div>
        </div>

        <div class="no-print" style="position:fixed; bottom:20px; right:20px; display:flex; gap:8px;">
          <button onclick="window.print()" style="padding:10px 20px; background:#333; color:#fff; border:none; cursor:pointer; border-radius:4px;">🖨️ PRINT</button>
          <button onclick="window.close()" style="padding:10px 20px; background:#eee; color:#333; border:none; cursor:pointer; border-radius:4px;">✕ CLOSE</button>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('view', 'document', id, {
        name: d.docNumber,
        type: d.type,
        action: 'print_preview'
      });
    }
  },

  // Generate quick invoice summary for email
  generateEmailSummary(id) {
    const d = App.Data.documents.find(x => x.id === id);
    if (!d || d.type !== 'invoice') return null;

    const cust = App.Data.customers.find(c => c.id === d.customerId);
    const conf = App.Data.config || {};
    const remaining = (d.grossTotal || 0) - (d.paidAmount || 0);

    return `
Invoice: ${d.docNumber}
Date: ${d.date?.split('T')[0] || '-'}
Due: ${d.dueDate?.split('T')[0] || '-'}

Customer: ${cust?.company || '-'}
${cust?.customerNumber ? 'Customer No: ' + cust.customerNumber : ''}

Total: ${App.Utils.formatCurrency(d.grossTotal)}
${d.paidAmount > 0 ? 'Paid: ' + App.Utils.formatCurrency(d.paidAmount) : ''}
Balance Due: ${App.Utils.formatCurrency(remaining)}

Payment Details:
Bank: ${conf.bankName || '-'}
IBAN: ${conf.iban || '-'}
BIC: ${conf.bic || '-'}
Reference: ${d.docNumber}

Thank you for your business!
${conf.companyName || 'MicroOps Global'}
    `.trim();
  },

  /**
   * Export documents to CSV
   */
  exportDocuments() {
    const docs = (App.Data.documents || []).filter(d => !d.isDeleted);

    if (docs.length === 0) {
      App.UI.Toast.show(App.I18n.t('common.noDataToExport', 'No data to export'));
      return;
    }

    // Build CSV with proper escaping and BOM for Excel
    const headers = ['Type', 'Number', 'Date', 'Due Date', 'Customer', 'Customer No', 'Net Total', 'VAT', 'Gross Total', 'Paid', 'Balance', 'Status', 'Payment Terms'];

    const rows = docs.map(d => {
      const cust = App.Data.customers.find(c => c.id === d.customerId);
      const paid = d.paidAmount || 0;
      const balance = (d.grossTotal || 0) - paid;
      const status = d.isFinalized ? 'Finalized' : 'Draft';

      return [
        d.type === 'invoice' ? 'Invoice' : 'Delivery Note',
        d.docNumber || d.id,
        (d.date || '').split('T')[0],
        (d.dueDate || '').split('T')[0],
        cust?.company || '',
        cust?.internalId || '',
        d.netTotal || 0,
        (d.grossTotal || 0) - (d.netTotal || 0),
        d.grossTotal || 0,
        paid,
        balance,
        status,
        d.paymentTerms || ''
      ];
    });

    // Use the secure CSV export utility
    const csvContent = App.Utils.exportToCSV([headers, ...rows]);

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Log activity
    if (App.Services.ActivityLog) {
      App.Services.ActivityLog.log('export', 'document', null, {
        action: 'csv_export',
        count: docs.length
      });
    }

    App.UI.Toast.show(`${App.I18n.t('common.exportSuccess', 'Export successful')} - ${docs.length} ${App.I18n.t('common.rows', 'rows')}`);
  },

  generateCustomerEmail(docId) {
    const t = (key, fallback) => App.I18n.t(`emailTemplate.${key}`, fallback);
    const ts = (key, fallback) => App.I18n.t(`settings.${key}`, fallback);
    const esc = App.Utils.escapeHtml;

    // Get the invoice document
    const invoice = (App.Data.documents || []).find(d => d.id === docId);
    if (!invoice) {
      App.UI.Toast.show(t('selectDocument', 'Please select a document'));
      return;
    }

    // Check if invoice is finalized (has a number)
    if (!invoice.docNumber) {
      App.UI.Toast.show(t('noInvoiceNumber', 'No invoice number - invoice must be finalized first'));
      return;
    }

    // Find associated delivery note(s) for the same order
    const deliveryNotes = (App.Data.documents || []).filter(d =>
      d.type === 'delivery' && d.orderId === invoice.orderId
    );

    // Get customer information
    const customer = (App.Data.customers || []).find(c => c.id === invoice.customerId);
    const cfg = App.Data.config || {};
    const emailTemplate = cfg.emailTemplate || {};

    // Get template or use defaults
    const defaultSubject = ts('defaultEmailSubject', 'Invoice {{Rechnungsnummer}} / Delivery Note {{Lieferscheinnummer}}');
    const defaultBody = ts('defaultEmailBody', 'Dear Sir or Madam,\n\nPlease find attached:\n\n- Delivery Note No. {{Lieferscheinnummer}} dated {{Lieferscheindatum}}\n- Invoice No. {{Rechnungsnummer}} dated {{Rechnungsdatum}}\n\nInvoice Amount: {{Gesamtbetrag}}\nPayment Due: {{Zahlungsziel}}\n\nPlease transfer the amount quoting the invoice number.\n\nBest regards\n{{BenutzerName}}\n\n{{Firmensignatur}}');

    const subjectTemplate = emailTemplate.subject || defaultSubject;
    const bodyTemplate = emailTemplate.body || defaultBody;

    // Calculate due date
    const invoiceDate = new Date(invoice.date);
    const dueDays = cfg.invoiceDueDays || 30;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Build placeholder values
    const placeholders = {
      '{{Anrede}}': customer?.salutation || 'Sehr geehrte Damen und Herren',
      '{{KundeName}}': customer?.company || customer?.name || '-',
      '{{KundenNummer}}': customer?.customerNumber || customer?.internalId || '-',
      '{{Rechnungsnummer}}': invoice.docNumber || '-',
      '{{Rechnungsdatum}}': App.Utils.formatDate(invoice.date),
      '{{Gesamtbetrag}}': App.Utils.formatCurrency(invoice.grossTotal || invoice.total || 0),
      '{{Zahlungsziel}}': App.Utils.formatDate(dueDate.toISOString()),
      '{{Lieferscheinnummer}}': deliveryNotes.map(d => d.docNumber || '-').join(', ') || '-',
      '{{Lieferscheindatum}}': deliveryNotes.length > 0 ? App.Utils.formatDate(deliveryNotes[0].date) : '-',
      '{{Firmenname}}': cfg.companyName || 'MicroOps',
      '{{Firmensignatur}}': [cfg.companyName, cfg.street, cfg.phone, cfg.email].filter(Boolean).join('\n'),
      '{{BenutzerName}}': App.Services.Auth?.currentUser?.name || 'MicroOps Team'
    };

    // Replace placeholders in templates
    let subject = subjectTemplate;
    let body = bodyTemplate;

    Object.keys(placeholders).forEach(placeholder => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      subject = subject.replace(regex, placeholders[placeholder]);
      body = body.replace(regex, placeholders[placeholder]);
    });

    // Show modal with generated email
    const modalBody = `
      <div>
        <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:12px;">
          ${t('generatedFor', 'Generated for')} <strong>${esc(customer?.company || '-')}</strong>
        </p>

        <div style="margin-bottom:12px;">
          <label class="field-label">${t('emailSubject', 'Subject')}</label>
          <input id="email-subject-output" class="input" value="${esc(subject)}" readonly style="background:var(--color-bg);" />
        </div>

        <div style="margin-bottom:16px;">
          <label class="field-label">${t('emailBody', 'Email Body')}</label>
          <textarea id="email-body-output" class="input" readonly style="height:300px; background:var(--color-bg); font-family:inherit; font-size:13px;">${esc(body)}</textarea>
        </div>

        <button class="btn btn-primary" id="btn-copy-email" style="width:100%;">
          📋 ${t('copyToClipboard', 'Copy to Clipboard')}
        </button>
      </div>
    `;

    App.UI.Modal.open(t('generateEmail', 'Email Text (Customer)'), modalBody, [
      { text: App.I18n.t('common.close', 'Close'), variant: 'ghost', onClick: () => {} }
    ]);

    // Set up copy button
    setTimeout(() => {
      const copyBtn = document.getElementById('btn-copy-email');
      if (copyBtn) {
        copyBtn.onclick = async () => {
          const bodyText = document.getElementById('email-body-output')?.value || '';
          try {
            await navigator.clipboard.writeText(bodyText);
            App.UI.Toast.show(t('copied', 'Copied to clipboard!'));

            // Log activity
            if (App.Services.ActivityLog) {
              App.Services.ActivityLog.log('export', 'email', invoice.id, {
                action: 'email_copied',
                invoiceNumber: invoice.docNumber,
                customer: customer?.company
              });
            }
          } catch (err) {
            // Fallback for older browsers
            const textarea = document.getElementById('email-body-output');
            if (textarea) {
              textarea.select();
              document.execCommand('copy');
              App.UI.Toast.show(t('copied', 'Copied to clipboard!'));
            }
          }
        };
      }
    }, 100);
  }
};
