# MicroOps ERP - Security Guide

**Version:** 0.4.0
**Last Updated:** 2025-11-22

---

## Overview

This document outlines security measures, best practices, and guidelines for safely operating MicroOps ERP.

---

## Authentication & Access Control

### PIN-Based Authentication

MicroOps uses 4-digit PIN authentication:
- Simple yet effective for single-user environments
- Combined with rate limiting for brute force protection
- PIN is not stored in plaintext (hashed on save)

### Rate Limiting

**Login Protection:**
- 5 failed attempts -> 5-minute lockout
- Lockout applies per user account
- Failed attempts logged to audit trail
- Countdown timer shows remaining lockout time

### Session Security

**Session Management:**
- Sessions expire after 30 minutes of inactivity
- Warning appears 5 minutes before timeout
- Option to extend session when warning appears
- Session data cleared on logout

**Auto-Lock:**
- Inactivity triggers session lock
- Must re-enter PIN to unlock
- Prevents unauthorized access on unattended workstations

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules and settings |
| **Sales** | Customers, Products, Pricing, Orders, Documents, Reports |
| **Warehouse** | Inventory, Movements, Components, Suppliers, Production |
| **Production** | Production orders, Components, Inventory, Movements |

**Permission Enforcement:**
- Navigation restricted based on role
- Actions validated server-side equivalent
- Unauthorized access attempts logged

---

## Data Protection

### Storage Security

**IndexedDB (Primary):**
- Sandboxed per browser origin
- No direct file system access
- Data encrypted at rest by browser (browser-dependent)

**localStorage (Fallback):**
- Limited to 5-10MB
- Same-origin policy enforced
- Used only when IndexedDB unavailable

### Data Isolation

- Data stored per-browser instance
- No cross-browser data sharing
- No external server communication
- All processing occurs client-side

### Input Validation

**XSS Prevention:**
- All user input sanitized via `App.Utils.escapeHtml()`
- HTML entities encoded on display
- No direct innerHTML with user data

**Business Rule Validation:**
- `App.Validate` enforces field constraints
- Required fields checked before save
- Data types validated (numbers, dates, etc.)
- Foreign key references validated

### Export Security

**CSV Export:**
- Formula injection prevention (prefix with single quote)
- Special characters escaped
- Values quoted to prevent delimiter issues

**JSON Export:**
- No executable code in exports
- Data-only serialization
- Optional encryption for sensitive exports

---

## Audit Trail

### What Gets Logged

| Event | Details Captured |
|-------|------------------|
| CREATE | Entity type, new record ID, user, timestamp |
| UPDATE | Entity type, record ID, changed fields, old/new values |
| DELETE | Entity type, deleted record ID, user, timestamp |
| LOGIN_SUCCESS | Username, timestamp |
| LOGIN_FAILURE | Username, attempt count, timestamp |
| SESSION_LOCK | Username, timestamp |
| SESSION_TIMEOUT | Username, duration |

### Audit Log Security

- Audit entries are append-only
- Cannot modify or delete individual entries
- Admin can clear old entries (logged as action)
- Export available for compliance archival

### Compliance Support

The audit trail supports:
- **GoBD/GDPdU** (German tax requirements)
- **Change tracking** with timestamps
- **User accountability** (who did what)
- **Data integrity** verification

---

## Backup Security

### Auto-Backup

- Triggers on browser close
- 7 rolling backups maintained
- SHA-256 hash for integrity verification
- Automatic cleanup of old backups

### Manual Backup

**Unencrypted:**
- JSON format, human-readable
- Contains all application data
- Suitable for version control

**Encrypted:**
- AES-256 encryption (via Web Crypto API)
- Password-protected
- Cannot recover without password
- Use strong passwords (12+ characters)

### Backup Best Practices

1. **Regular Exports:** Download encrypted backup weekly
2. **Multiple Locations:** Store backups in 2+ locations
3. **Test Restores:** Verify backups work quarterly
4. **Secure Storage:** Protect backup files like production data
5. **Password Management:** Store encryption passwords securely

---

## Network Security

### Offline-First Architecture

**No External Connections:**
- Application runs entirely in browser
- No data sent to external servers
- No analytics or tracking
- No CDN dependencies (all assets local)

**Benefits:**
- No network attack surface
- No data interception risk
- Works in air-gapped environments
- No third-party data exposure

### Offline Safety & Posting Policy

- In GA v1 backend/remote deployments, offline mode is **read + draft only**. Users may browse cached data and fill forms, but cannot finalize operations that change stock or financial state.
- The following actions **require an online backend call**:
  - Posting shipments (`inventoryService.postShipment` via `/api/inventory/...`).
  - Posting invoices or credit notes (`documentService.postDocument`).
  - Marking invoices paid (`markDocumentPaid`).
- Legacy local/demo flows that finalize invoices or adjust stock purely in the browser are **non-GA** and must remain disabled unless explicitly running in a single-user local/demo configuration flag.
- A future release will add a controlled offline write queue with reconciliation; until then, GA v1 forbids offline posting to protect auditability and invariants.

### Browser Security

Rely on browser security features:
- Same-origin policy
- Content Security Policy (where configured)
- Automatic HTTPS upgrade
- Sandboxed storage

---

## Security Best Practices

### For Users

1. **Use Unique PINs:** Don't share PINs or use obvious patterns
2. **Log Out:** Always log out when leaving workstation
3. **Lock Screens:** Enable OS screen lock for unattended periods
4. **Report Issues:** Report suspicious activity to admin
5. **Backup Data:** Maintain personal backups of critical data

### For Administrators

1. **User Management:**
   - Create individual accounts (no shared logins)
   - Assign minimum necessary permissions
   - Disable inactive user accounts
   - Review user list quarterly

2. **Backup Management:**
   - Verify auto-backup is working
   - Download encrypted backups for offsite storage
   - Test restore procedures
   - Document backup schedule

3. **Monitoring:**
   - Review audit log weekly for anomalies
   - Check failed login attempts
   - Monitor storage usage
   - Run health checks regularly

4. **Incident Response:**
   - Document security incidents
   - Restore from backup if needed
   - Update PINs after suspected breach
   - Review and tighten permissions

---

## Data Handling Guidelines

### Sensitive Data

**What's Sensitive:**
- Customer contact information
- Pricing and discount structures
- Financial transaction data
- User credentials

**Handling:**
- Access only when needed
- Don't export more than necessary
- Secure exported files
- Delete exports after use

### Data Retention

**Recommended Periods:**
| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Transactions | 7+ years | Tax/legal requirements |
| Audit logs | 10 years | Compliance |
| Backups | 90 days | Recovery capability |
| Session data | 24 hours | Security |

### Data Disposal

When removing data:
1. Export for archive if required
2. Delete from application
3. Clear browser storage if disposing device
4. Securely delete exported files

---

## Incident Response

### Suspected Security Incident

1. **Contain:** Log out all sessions
2. **Document:** Note what happened and when
3. **Report:** Inform administrator immediately
4. **Preserve:** Don't modify potential evidence
5. **Recover:** Restore from known good backup

### Common Incidents

**Unauthorized Access Attempt:**
- Check audit log for failed logins
- Verify account lockouts are working
- Consider changing affected PINs

**Data Corruption:**
- Don't modify corrupt data
- Restore from most recent good backup
- Report for investigation

**Lost/Stolen Device:**
- Data remains in browser (not exposed)
- Clear browser data remotely if possible
- Change all user PINs as precaution

---

## Security Checklist

### Initial Setup

- [ ] Change default admin PIN
- [ ] Create individual user accounts
- [ ] Assign appropriate roles
- [ ] Verify backup system working
- [ ] Document admin procedures

### Ongoing (Weekly)

- [ ] Review audit log
- [ ] Check failed login attempts
- [ ] Verify storage health
- [ ] Download backup for offsite storage

### Periodic (Monthly)

- [ ] Review user accounts and permissions
- [ ] Test backup restore procedure
- [ ] Update any weak PINs
- [ ] Review security incidents

### Annual

- [ ] Full security review
- [ ] Update this documentation
- [ ] User security awareness refresh
- [ ] Disaster recovery drill

---

## Limitations & Considerations

### Known Limitations

1. **Browser Dependency:** Security relies on browser implementation
2. **Single Factor:** PIN-only authentication (no 2FA)
3. **Local Storage:** Data vulnerable if browser storage accessed directly
4. **No Encryption at Rest:** Depends on browser/OS encryption

### Compensating Controls

- Rate limiting reduces brute force risk
- Session timeout limits exposure window
- Audit trail provides accountability
- Offline operation eliminates network risks

### Not Suitable For

- High-security environments requiring 2FA
- Multi-tenant deployments
- Public-facing applications
- Highly regulated industries (healthcare, finance)

---

## Contact

For security concerns or to report vulnerabilities:

**Email:** security@microops.local
**Priority:** Treat all security reports as High (P2) or Critical (P1)

---

*This guide should be reviewed and updated with each major release.*
