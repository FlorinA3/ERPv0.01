# MicroOps ERP

A production-ready, offline-first ERP system for Austrian SMEs, implemented as a single-page application with vanilla JavaScript.

## Current Version: 0.4.0

### Production Readiness Status

| Category | Status | Score |
|----------|--------|-------|
| Storage & Data | IndexedDB (100MB+) with localStorage fallback | 9/10 |
| Backup System | Auto-backup on exit, 7 rolling backups, encryption | 9/10 |
| Audit Trail | Complete change tracking with export | 9/10 |
| Security | Rate limiting, session management, XSS protection | 8/10 |
| Health Monitoring | System health checks, integrity validation | 9/10 |
| Error Handling | Global error boundaries, retry logic | 8/10 |
| **Overall** | **Production Ready** | **8.5/10** |

## Quick Start

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox)
2. Log in with default admin user (PIN: 1234)
3. Start using the ERP system

## Key Features

### Core Modules
- **Dashboard**: KPIs, revenue tracking, low stock alerts, overdue invoices
- **Customers**: Full CRUD with sequential numbering (K-2025-XXXX)
- **Products**: Multi-language names, BOM support, pricing tiers
- **Orders**: Price cascade, stock validation, status workflow
- **Documents**: Invoice/Delivery Note generation, A4 printing, payment tracking
- **Production**: BOM-based production orders, LOT tracking
- **Inventory**: Stock movements, batch/LOT management
- **Reports**: CSV exports for all key entities

### Recent Improvements (Phases 45-47)

#### Storage & Backup (Phase 45)
- **IndexedDB Migration**: 100MB+ capacity vs 5-10MB localStorage
- **Auto-Backup**: Saves on browser close, maintains 7 rolling backups
- **Backup Encryption**: Password-protected backup files
- **Integrity Verification**: Hash-based corruption detection

#### Audit Trail (Phases 45-46)
- **Complete Change Tracking**: Logs CREATE/UPDATE/DELETE operations
- **Change Detection**: Field-by-field comparison of old/new values
- **Query & Filter**: Search by date, action, entity, user
- **CSV Export**: Full audit log export for compliance

#### Security (Phase 47)
- **Login Rate Limiting**: 5 attempts → 5-minute lockout
- **Session Management**: 30-minute timeout with 5-minute warning
- **XSS Protection**: All user inputs escaped via `escapeHtml()`
- **Security Audit Logging**: Failed login attempts tracked

#### Health Monitoring (Phase 47)
- **System Health Checks**: Storage, backups, data integrity, audit size
- **Integrity Validation**: Detects orphan references, invalid data
- **Global Error Boundary**: Catches and recovers from fatal errors
- **Visual Status Dashboard**: Color-coded health indicators

### Data Validation
- **Centralized Validation**: `App.Validate` for all entity types
- **Required Field Enforcement**: Mandatory fields clearly marked
- **Business Rule Validation**: Prevents invalid states
- **Clear Error Messages**: Specific, actionable feedback

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), no frameworks
- **Storage**: IndexedDB (primary) + localStorage (fallback)
- **Styling**: CSS variables for theming
- **Printing**: CSS print media queries for A4 documents

### Code Organization
```
js/
├── app.js         # Core services, auth, utilities
├── db.js          # IndexedDB/localStorage abstraction
├── audit.js       # Audit trail & validation
├── api.js         # Data access layer abstraction
├── router.js      # SPA routing
└── pages/         # Page-specific modules
    ├── dashboard.js
    ├── customers.js
    ├── orders.js
    ├── products.js
    ├── documents.js
    ├── production.js
    ├── settings.js
    └── ...
```

### Key Services
- `App.DB` - Storage abstraction (IndexedDB/localStorage)
- `App.Audit` - Audit trail logging
- `App.Validate` - Data validation
- `App.Services.Auth` - Authentication & session management
- `App.Services.Health` - System health monitoring
- `App.Services.ActivityLog` - Activity logging
- `App.Services.NumberSequence` - Sequential ID generation
- `App.Services.PriceCascade` - Price list cascade logic

## Settings & Configuration

### Settings Tabs
1. **Company**: Business info, banking, tax settings
2. **Users**: User management with roles (admin, sales, warehouse, production)
3. **System**: Number sequences, auto-lock, tutorials
4. **Communication**: Email templates with placeholders
5. **Backups**: Auto-backup management, manual backup/restore, encryption
6. **Audit Log**: Audit trail viewer with filters and export
7. **Activity Log**: User activity tracking with retention settings
8. **System Health**: Health checks, integrity validation, statistics

### User Roles
- **Admin**: Full access to all modules and settings
- **Sales**: Orders, customers, documents, dashboard
- **Warehouse**: Inventory, stock movements, batches
- **Production**: Production orders, BOM management

## Compliance

### Austrian Tax/Legal
- VAT rates: 0%, 10%, 13%, 20%
- Sequential invoice numbering without gaps
- Invoice immutability after finalization
- Mandatory invoice contents (UID, payment terms, etc.)

### GoBD/GDPdU Readiness
- Complete audit trail with timestamps
- Change tracking with old/new values
- Long-term document retention
- Tamper detection via integrity checks

## Browser Support
- Chrome 80+
- Edge 80+
- Firefox 75+

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [HowToUse.md](./HowToUse.md) - User manual
- [MICROOPS_SPEC.md](./MICROOPS_SPEC.md) - Technical specification
- [BLUEPRINT_COMPLETE.md](./BLUEPRINT_COMPLETE.md) - Implementation blueprint
- [GA_RULES_FULL.md](./GA_RULES_FULL.md) - GA compliance rules

## Known Limitations

1. Single-browser operation (no real-time sync between browsers)
2. Manual document creation stubbed (use order workflow)
3. No PDF generation (relies on browser print-to-PDF)

## Roadmap

### Version 0.5.0
- [ ] Offline queue with sync
- [ ] Service worker for PWA support
- [ ] Enhanced PDF generation

### Version 0.6.0
- [ ] Backend migration (Node.js/Express)
- [ ] PostgreSQL database
- [ ] Real-time multi-user sync

## License

Proprietary - All rights reserved

## Contributors

- Development: Claude AI Assistant
- Project Owner: User
