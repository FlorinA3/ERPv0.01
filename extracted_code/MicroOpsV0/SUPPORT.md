# MicroOps ERP - Support Guide

**Version:** 0.4.0
**Last Updated:** 2025-11-22

---

## Support Contact Information

### Primary Support Channel

**Email:** support@microops.local
**Hours:** Monday - Friday, 08:00 - 17:00 CET

For urgent production issues outside business hours, contact your designated system administrator.

### Issue Reporting

When reporting issues, please include:
1. Your username and role
2. Date and time of the issue
3. Steps to reproduce the problem
4. Any error messages displayed
5. Browser and version (Help → System Info)

---

## Service Level Agreement (SLA)

### Response Time Targets

| Priority | Description | Initial Response | Resolution Target |
|----------|-------------|------------------|-------------------|
| **Critical** | System unusable, data loss risk | 1 hour | 4 hours |
| **High** | Major feature broken, no workaround | 4 hours | 1 business day |
| **Medium** | Feature impaired, workaround exists | 8 hours | 3 business days |
| **Low** | Minor issue, cosmetic, enhancement | 2 business days | Next release |

### Priority Definitions

**Critical (P1)**
- Application won't start
- Data corruption or loss
- All users cannot log in
- Core workflow completely blocked

**High (P2)**
- Major module not working (Orders, Documents, Production)
- Cannot create or save records
- Incorrect calculations (totals, VAT)
- Backup/restore failure

**Medium (P3)**
- Single feature not working
- Performance degradation
- UI rendering issues
- Non-blocking errors

**Low (P4)**
- Minor visual issues
- Feature enhancement requests
- Documentation clarifications
- Usability suggestions

---

## New User Training Checklist

### Day 1: Getting Started (2-3 hours)

#### 1. System Access
- [ ] Receive login credentials from admin
- [ ] Successfully log in to MicroOps
- [ ] Change PIN on first login
- [ ] Verify correct role assignment

#### 2. Navigation Basics
- [ ] Understand sidebar menu structure
- [ ] Use Dashboard overview
- [ ] Access Help tab (Settings → Help)
- [ ] Practice keyboard shortcuts (F1)

#### 3. Company Configuration Review
- [ ] Review company settings
- [ ] Understand VAT and currency settings
- [ ] Review default payment/delivery terms

### Day 2: Core Operations (3-4 hours)

#### 4. Customer Management
- [ ] View existing customers
- [ ] Add a test customer
- [ ] Edit customer details
- [ ] Add customer addresses

#### 5. Product Catalog
- [ ] Browse product list
- [ ] Understand product fields
- [ ] View stock levels
- [ ] Add/edit a product

#### 6. Order Processing
- [ ] Create a new order
- [ ] Add line items
- [ ] Review order totals
- [ ] Understand order status workflow

### Day 3: Documents & Workflow (2-3 hours)

#### 7. Document Generation
- [ ] Generate delivery note from order
- [ ] Generate invoice from order
- [ ] Print/preview documents
- [ ] Understand document numbering

#### 8. Complete Order Workflow
- [ ] Create Order → Generate Delivery Note → Generate Invoice
- [ ] Practice the complete cycle
- [ ] Verify stock movements

### Day 4: Advanced Features (2-3 hours)

#### 9. Production (if applicable)
- [ ] Create production order
- [ ] Add BOM components
- [ ] Complete production order
- [ ] Verify stock updates

#### 10. Data Management
- [ ] Create manual backup
- [ ] Understand auto-backup system
- [ ] View audit trail
- [ ] Run system health check

### Week 1: Proficiency Check

#### Self-Assessment
- [ ] Can create customer → order → documents independently
- [ ] Understands error messages and troubleshooting
- [ ] Knows how to access help resources
- [ ] Comfortable with daily operations

#### Questions for Admin Review
1. How do I handle order changes after delivery?
2. What's the process for stock adjustments?
3. How often should I create manual backups?
4. What should I do if I see an error?

---

## Quick Reference Cards

### Daily Operations Checklist

**Start of Day:**
1. Log in and review Dashboard
2. Check low stock alerts
3. Review open orders
4. Check any overnight issues in audit log

**During Operations:**
1. Process orders promptly
2. Generate documents for shipped orders
3. Update order status accurately
4. Log any issues encountered

**End of Day:**
1. Review completed work
2. Ensure all changes saved
3. Check system health status
4. Close browser (auto-backup triggers)

### Common Tasks Quick Guide

| Task | Navigation | Key Steps |
|------|------------|-----------|
| New Customer | Customers → + Add | Fill form → Save |
| New Order | Orders → + Create | Select customer → Add items → Save |
| Delivery Note | Orders → 📦 | Select order → Generate |
| Invoice | Orders → 🧾 | Select order → Generate |
| Print Document | Documents → 👁️ | Preview → Ctrl+P |
| Manual Backup | Settings → Backups | Download Backup |
| Health Check | Settings → System Health | Run Health Check |

---

## Escalation Path

### Level 1: Self-Service
- Check in-app Help tab (Settings → Help)
- Review HowToUse.md documentation
- Check Troubleshooting section

### Level 2: Peer Support
- Ask trained colleague
- Review training materials
- Check FAQ/known issues

### Level 3: Administrator
- Contact local system administrator
- Provide detailed issue description
- Include steps to reproduce

### Level 4: Technical Support
- Email support@microops.local
- For P1/P2 issues only
- Include all diagnostic information

---

## Frequently Asked Questions

### General

**Q: How often is my data saved?**
A: Data saves immediately to IndexedDB after each action. Auto-backup also runs when you close the browser.

**Q: Can I access MicroOps from multiple devices?**
A: Data is stored per-browser. For multi-device access, use backup/restore to sync data.

**Q: What browsers are supported?**
A: Chrome, Firefox, Edge, and Safari (latest versions recommended).

### Data & Backup

**Q: How many backups are kept?**
A: The system maintains 7 rolling backups automatically.

**Q: Can I encrypt my backups?**
A: Yes, enter a password when downloading to create an encrypted backup.

**Q: What happens if I clear browser data?**
A: All ERP data will be lost. Always maintain external backups.

### Operations

**Q: Can I edit an invoice after creation?**
A: Invoices are locked after generation. Create a credit note or new invoice instead.

**Q: Why can't I delete a customer?**
A: Customers with linked orders cannot be deleted. Archive them instead.

**Q: How do I correct stock levels?**
A: Go to Inventory, find the product, and adjust the stock field directly.

---

## Support Hours & Availability

### Standard Support
- Monday - Friday: 08:00 - 17:00 CET
- Response within SLA targets above

### Extended Support (by arrangement)
- Contact administrator for after-hours support
- P1 issues only

### Holidays & Closures
- Support follows local business calendar
- Reduced coverage during holiday periods
- Emergency contact available for P1

---

## Feedback & Suggestions

We welcome feedback to improve MicroOps:

1. **Feature Requests:** Email with subject "Feature Request: [Brief Title]"
2. **Bug Reports:** Use standard issue reporting format
3. **Documentation:** Suggest improvements to this guide
4. **Training:** Request additional training sessions

---

*Document maintained by MicroOps Support Team*
