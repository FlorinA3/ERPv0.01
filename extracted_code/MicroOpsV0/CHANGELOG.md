# MicroOps ERP - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2025-11-22

### Phase 51: Browser Compatibility & System Requirements

#### Added

##### Browser Compatibility Documentation (BROWSER_COMPATIBILITY.md)
- **Supported Browsers**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **System Requirements**: Hardware specs (CPU, RAM, storage, display)
- **Feature Support Matrix**: IndexedDB, Web Crypto, Intl APIs per browser
- **Storage Limits**: IndexedDB/localStorage capacity by browser
- **Performance Benchmarks**: Startup, operation times, memory usage
- **Testing Checklist**: Pre-deployment browser verification
- **Troubleshooting**: Common browser-specific issues and solutions

##### Version Rollback Procedure
- Step-by-step rollback using backup restore
- Emergency recovery procedures
- Data migration compatibility notes

#### Updated

##### GA Checklist (GA_CHECKLIST.md)
- **Score Improvement**: 95/120 (79%) → 98/120 (82%)
- **Fully Supported**: 16/20 → 17/20 (+1)
- **Wide Accessibility**: 15/20 → 17/20 (+2)
- **3 items resolved**: Browser matrix, PC specs, rollback procedure

---

### Phase 50: GA Documentation & Compliance

#### Added

##### Support Documentation (SUPPORT.md)
- **Contact Information**: Primary support channel and email
- **Service Level Agreement**: Response time targets by priority (P1-P4)
- **Training Checklist**: Complete 4-day onboarding program
  - Day 1: System access and navigation basics
  - Day 2: Core operations (customers, products, orders)
  - Day 3: Documents and workflow
  - Day 4: Advanced features
- **Quick Reference Cards**: Daily operations and common tasks
- **Escalation Path**: 4-level support escalation
- **FAQ Section**: Common questions answered

##### Security Guide (SECURITY_GUIDE.md)
- **Authentication & Access Control**: PIN system, rate limiting, RBAC
- **Data Protection**: Storage security, input validation, XSS prevention
- **Audit Trail Documentation**: What gets logged, compliance support
- **Backup Security**: Auto-backup, encryption options, best practices
- **Network Security**: Offline-first architecture benefits
- **Security Best Practices**: User and admin checklists
- **Data Handling Guidelines**: Sensitive data, retention, disposal
- **Incident Response**: Procedures for security incidents

##### Release Policy (RELEASE_POLICY.md)
- **Version Numbering**: Semantic versioning explanation
- **Release Stages**: Alpha → Beta → RC → GA definitions
- **GA Release Criteria**: Technical, documentation, operational requirements
- **Release Process**: 5-phase release workflow
- **Sign-Off Process**: Approval chain and template
- **Hotfix Process**: When and how to hotfix
- **Rollback Procedure**: Steps and data considerations
- **Feedback Collection**: Channels and classification
- **Post-Mortem Process**: Template and schedule
- **Hypercare Period**: 2-4 week enhanced monitoring plan

#### Updated

##### GA Checklist (GA_CHECKLIST.md)
- **Score Improvement**: 83/120 (69%) → 95/120 (79%)
- **Fully Supported**: 12/20 → 16/20 (+4)
- **Market-Ready**: 13/20 → 16/20 (+3)
- **Transition & Release**: 10/20 → 15/20 (+5)
- **8 items resolved**: Support, security, release documentation complete

---

### Phase 49: UX Improvements & Export Enhancements

#### Added

##### Offline Status Indicator (js/ui/navbar.js, js/app.js)
- **Visual Indicator**: Persistent "⚠️ Offline" badge in navbar when browser is offline
- **Auto-Toggle**: Shows/hides automatically on network status change
- **Toast Notifications**: Alerts when going offline/online

##### Loading State Utility (js/app.js)
- **App.UI.Loading.show(message)**: Display loading overlay with spinner
- **App.UI.Loading.hide()**: Remove loading overlay
- **App.UI.Loading.wrap(promise, message)**: Auto-wrap async operations
- **Visual Design**: Centered spinner with message, dark backdrop

##### Global Print Styles (css/base.css)
- **@media print**: Comprehensive print stylesheet
- **Hidden Elements**: Navbar, sidebar, buttons, modals hidden when printing
- **Table Optimization**: Page-break handling, repeated headers
- **A4 Page Setup**: 15mm/20mm margins, proper sizing
- **Utility Classes**: `.no-print`, `.print-only`

##### Export Enhancements (js/app.js)
- **App.Utils.exportToCSV(data)**: Array-based CSV export with sanitization
- **App.Utils.exportJSON(data, filename)**: JSON export with pretty-print
- **App.Utils.download(content, filename, mimeType)**: Universal download utility
- **Formula Injection Protection**: Dangerous characters prefixed in CSV

---

### Phase 48: In-App Help & Troubleshooting System

#### Added

##### Help Tab (js/pages/settings.js)
- **System Information**: Version display, storage type indicator, production status badge
- **Keyboard Shortcuts Reference**: Visual display of all available shortcuts with kbd styling
- **Troubleshooting Guides**: Expandable accordion sections for common issues:
  - Login issues (PIN problems, account lockouts)
  - Data not saving (storage capacity, browser settings)
  - Document generation failures (validation, prerequisites)
  - Performance issues (health checks, cleanup)
  - Storage capacity warnings (export, cleanup options)
  - Application errors (recovery, audit log)
- **Quick Tips**: Cards with key feature highlights (auto-backup, session timeout, audit trail, encryption)
- **Application Reset Guide**: Step-by-step instructions with safety warnings

##### Global Help Button (js/ui/navbar.js)
- **Help Icon (❓)**: Added to navbar between theme selector and logout
- **Quick Access**: One-click navigation to Help tab in Settings
- **Tooltip**: "Help & Troubleshooting" on hover

##### F1 Help Integration (js/app.js)
- **Full Help Button**: Added to keyboard shortcuts modal
- **Navigation**: Links directly to Help tab in Settings

---

### Phase 47: Security Hardening & Health Monitoring

#### Added

##### Login Rate Limiting (js/app.js)
- **Brute Force Protection**: 5 failed attempts trigger 5-minute account lockout
- **Attempt Tracking**: `_loginAttempts` object tracks attempts per user
- **Countdown Display**: Shows remaining time when locked out
- **Attempt Counter**: Shows remaining attempts after each failure
- **Security Audit Log**: Logs account lockout events to audit trail

##### Global Error Handling (js/app.js)
- **Error Boundary**: `window.onerror` catches all unhandled errors
- **Promise Rejection Handler**: `window.onunhandledrejection` catches async errors
- **Error Recovery UI**: Displays user-friendly error message with reload button
- **Error Logging**: Logs all errors to audit trail with stack traces

##### Health Monitoring Service (js/app.js)
- **App.Services.Health.check()**: Comprehensive system health check
- **Storage Check**: Monitors IndexedDB usage vs quota (warning at 80%, critical at 95%)
- **Data Integrity Check**: Detects orphan references and invalid data
- **Backup Status**: Monitors backup age (warning after 24h, critical after 72h)
- **Audit Size Check**: Monitors audit log size (warning at 10K, critical at 50K entries)
- **Session Monitoring**: Tracks active sessions and current user

##### Integrity Check System (js/app.js)
- **runIntegrityChecks()**: Scans for data integrity issues
- **Orphan Detection**: Orders without customers, documents without orders
- **BOM Validation**: Products with invalid component references
- **Stock Validation**: Detects negative stock values
- **Actionable Results**: Returns list of issues with details

##### Settings Health Tab (js/pages/settings.js)
- **Health Check Button**: Runs comprehensive system health check
- **Integrity Check Button**: Scans for data integrity issues
- **Visual Status Display**: Color-coded status indicators (green/amber/red)
- **Quick Statistics**: Total records, audit entries, active sessions
- **Issue List**: Displays found integrity issues with details

#### Changed
- Settings tabs now include System Health tab
- CHANGELOG updated with Phases 45, 46, and 47

---

## [0.3.0] - 2025-11-22

### Phase 45: GA Improvement Sprint - Production Readiness

#### Added

##### IndexedDB Storage Migration (js/db.js)
- **Primary Storage**: IndexedDB with 100MB+ capacity (vs 5-10MB localStorage)
- **Automatic Fallback**: Falls back to localStorage if IndexedDB unavailable
- **Object Stores**: 'data' for main data, 'backups' for backup history
- **Async Methods**: `_initIndexedDB()`, `_idbGet()`, `_idbPut()`, `_idbGetAll()`, `_idbDelete()`
- **Storage Monitoring**: `getStorageInfo()` returns usage, quota, available space

##### Auto-Backup System (js/db.js)
- **Window Close Backup**: `autoBackupOnExit()` saves on beforeunload
- **Rolling Backups**: Maintains 7 most recent backups with `_pruneBackups()`
- **Backup Storage**: `storeBackup()` with timestamp, data, hash, size
- **Backup Listing**: `listBackups()` returns array of available backups
- **Backup Restore**: `restoreFromBackup(timestamp)` with integrity verification

##### Backup Integrity Verification (js/db.js)
- **Hash Calculation**: `calculateHash(data)` using string-based hash
- **Integrity Check**: Verifies hash on restore, throws error if corrupted
- **Backup Metadata**: Stores timestamp, data, hash, size for each backup

##### Complete Audit Trail System (js/audit.js - NEW FILE)
- **Audit Logging**: `App.Audit.log(action, entity, entityId, oldValue, newValue)`
- **Change Detection**: `_detectChanges()` compares old/new values field by field
- **Query & Filter**: `query(filters)` with dateFrom, dateTo, action, entity, userId
- **Export Capabilities**: `export()` and `downloadCSV()` for audit reports
- **Statistics**: `getStats()` returns counts by action, entity, user

##### Error Handling Improvements (js/app.js)
- **Retry Logic**: 3 attempts with exponential backoff for save operations
- **Quota Detection**: Detects storage quota exceeded errors
- **Toast Notifications**: `showMessage()`, `showSuccess()`, `showError()`, `showWarning()`
- **Error Banner**: `updateErrorBanner()` and `dismissError()` for persistent errors

##### Data Validation Framework (js/audit.js)
- **App.Validate Object**: Centralized validation for all entity types
- **Order Validation**: Customer, items, totals, dates
- **Customer Validation**: Company name, required fields
- **Product Validation**: Article number, name, prices
- **Document Validation**: Document number, type, customer
- **Component Validation**: Part number, name, unit

##### Backup Encryption (js/db.js)
- **Encrypt Function**: `encryptData(data, password)` using XOR cipher + base64
- **Decrypt Function**: `decryptData(encrypted, password)`
- **Encrypted Export**: `exportBackup(password)` for secure backups
- **Encrypted Import**: `importBackup(file, password)` for secure restore

##### Session Management (js/app.js)
- **SessionManager**: 30-minute timeout with 5-minute warning
- **Activity Tracking**: `updateActivity()` on click, keydown, throttled mouse move
- **Timeout Check**: `checkTimeout()` runs every 10 seconds
- **Session Warning**: `showWarning()` modal 5 minutes before logout
- **Force Logout**: `forceLogout()` with reason, `manualLogout()` for user action

#### Changed
- **index.html**: Added audit.js script reference
- **base.css**: Added slideIn/slideOut animations for toast notifications
- **beforeunload**: Updated to call `App.DB.autoBackupOnExit()`

---

### Phase 46: Audit Trail Integration & Backup Management UI

#### Added

##### Audit Logging Integration
- **customers.js**: Validation + audit logging for CREATE/UPDATE/DELETE operations
- **orders.js**: Validation + audit for CREATE/UPDATE/DELETE/status changes
- **products.js**: Validation + audit for CREATE/UPDATE/DELETE/BOM changes
- **documents.js**: Audit for all operations (create, edit, delete, finalize, payments, restore, trash)

##### Settings Page - Backups Tab (js/pages/settings.js)
- **Auto-Backup List**: View/restore from 7 rolling IndexedDB backups
- **Create Backup**: On-demand backup creation button
- **Manual Backup**: Download/restore from file
- **Encrypted Backup**: Password-protected backup downloads
- **Storage Info**: Display used, quota, available space

##### Settings Page - Audit Log Tab (js/pages/settings.js)
- **Statistics Dashboard**: Total entries, creates, updates, deletes
- **Filters**: Filter by action type, entity type, search text
- **Audit Table**: Timestamp, user, action, entity, ID, changes
- **Export CSV**: Download audit log as CSV
- **Clear Old Entries**: Remove entries older than 30/60/90/180 days

#### Changed
- **Settings tabs**: Added Backups and Audit Log tabs to existing tabs

---

## [0.2.0] - 2025-11-22

### Phase 40: CSV Import, Global Search & Keyboard Shortcuts

#### Added
- **CSV Import Utility** (`App.Utils.parseCSV`): Parses CSV content with proper handling of quotes, commas, and European semicolon delimiters
- **Field Mapping Utility** (`App.Utils.mapCSVFields`): Flexible field mapping supporting German/English column names (e.g., "Firma" maps to "company")
- **Customers CSV Import**:
  - Import button in Customers page header
  - File picker with preview of first 5 rows
  - Downloadable CSV template
  - Duplicate detection by company name
  - Maps: company, contact, email, phone, street, city, zip, country, segment, vatNumber, paymentTerms, notes
- **Products CSV Import**:
  - Import button in Products page header
  - File picker with preview of first 5 rows
  - Downloadable CSV template
  - Duplicate detection by article number
  - Maps: articleNumber, nameDE, nameEN, type, purchasePrice, dealerPrice, endCustomerPrice, stock, minStock, unit
- **Import Translations**: Full DE/EN/RO support for all import-related messages

#### Enhanced Global Search
- Added search for Purchase Orders, Production Orders, Batches/LOTs, and Carriers
- Updated search placeholder to show Ctrl+K shortcut
- Added type labels for new search categories
- Grouped search results by category for better organization

#### Enhanced Keyboard Shortcuts
- **Ctrl+K**: Focus global search (new)
- **Ctrl+F**: Focus page-specific search (improved to check page search first)
- Added `_focusGlobalSearch()` utility function
- Updated help dialog (F1) to include new shortcut

#### Audit Log Retention Policy
- **Retention Configuration**: Configurable retention period (30, 60, 90, 180, 365 days)
- **Auto-cleanup**: Option to automatically clean old logs on app startup
- **Settings UI**: Added log retention settings in System tab
  - Retention period dropdown
  - Auto-cleanup toggle
  - Manual cleanup button
  - Log statistics display (entries, size, oldest date)
- **New ActivityLog methods**:
  - `getRetentionConfig()`: Get current retention settings
  - `setRetentionConfig()`: Save retention settings
  - `autoCleanup()`: Run cleanup based on policy
  - `getStats()`: Get log statistics

#### Multi-User Concurrency Handling
- **Session Manager Service** (`App.Services.SessionManager`):
  - Tracks active sessions with unique session IDs
  - Heartbeat mechanism (30s interval) to maintain session presence
  - Automatic stale session cleanup (2-minute timeout)
  - Concurrent session detection and warnings
- **Features**:
  - Warning toast when other active sessions detected at login
  - Automatic session end on logout and page close
  - Session info tracking (user, start time, last activity, browser)
  - Prevents data conflicts when multiple users access shared folder

---

### Phase 39: GA Compliance - Translation Pattern Standardization

#### Changed
- **Customers Module**: Added translation helper pattern with `const t = (key, fallback) => App.I18n.t(...)` for consistent i18n
- **Products Module**: Added translation helper pattern for standardized translations
- **Purchase Orders Module**: Added translation helper pattern and XSS protection via `esc = App.Utils.escapeHtml`
- **Batches Module**: Translated all hardcoded modal strings (LOT Number, Type, Product, Component, Quantity, etc.)

#### Added
- **Purchase Orders Translations**: Full i18n support for DE/EN/RO
  - 27 translation keys per language
  - Status labels (Draft, Sent, Confirmed, Received, Closed, Cancelled)
  - Form fields (PO Number, Supplier, Expected Date, Line Items, etc.)
- **Batches Module QC Modal**: Translated QC status, inspector, date, and notes labels
- **Accessibility**: Added `aria-required="true"` to required form fields

#### Fixed
- Missing XSS protection in Purchase Orders table (PO number, supplier name now escaped)
- Hardcoded "No purchase orders" message now uses translation system

---

## [0.1.0] - 2025-11-22

### Phase 1: Foundation - Complete

This release establishes the core foundation for production-ready ERP functionality.

### Added

#### Authentication & Security
- **Session Lock System**: Auto-lock after configurable inactivity period (default 30 minutes)
- **Lock Screen UI**: Blur overlay with PIN unlock
- **Role-Based Access Control (RBAC)**: Permissions matrix for admin, sales, warehouse, production roles
- **Route Protection**: Unauthorized routes redirect to dashboard with notification
- **Remember Me**: Checkbox to persist login across browser sessions

#### User Management (Settings Page)
- **Full CRUD Operations**: Add, edit, delete users
- **User Modal**: Name, 4-digit PIN, role, language preference, theme preference, active status
- **Admin Protection**: Cannot delete last admin user
- **User Preferences**: Per-user language and theme settings

#### Number Sequence Service
- **Sequential Document IDs**:
  - Orders: `A2025-XXXX`
  - Delivery Notes: `L20250XXXXX`
  - Invoices: `R20250XXXXX`
  - Production Orders: `PO-2025-XXX`
- **Persistent Counters**: Stored in config.numberSequences
- **Year-Aware**: Includes current year in formats

#### Validation Service
- **Required Field Validation**: Generic validator for forms
- **Email Validation**: RFC-compliant regex
- **Phone Validation**: International format support
- **IBAN Validation**: Format checking
- **VAT Validation**: EU VAT ID format
- **Stock Availability Check**: Real-time inventory validation

#### Backup & Restore System
- **JSON Export**: Full database backup with metadata
- **Timestamped Filenames**: `microops_backup_YYYY-MM-DDTHH-MM-SS.json`
- **Import Validation**: Checks for valid backup structure
- **Statistics Reporting**: Shows record counts after restore
- **UI Integration**: Buttons in Settings page

#### Data Model Enhancements
- **Storage Key Versioning**: Bumped to V4 for schema changes
- **Complete Config Schema**:
  - Company info (name, address, VAT, register number)
  - Bank details (IBAN, BIC, bank name)
  - Defaults (VAT rate, payment terms, delivery terms)
  - UI settings (language, theme)
  - Environment flags (isDemo)
  - Auto-lock duration
  - Number sequences
- **Data Normalization**: Legacy uppercase keys mapped to lowercase

#### Documentation
- **HowToUse.md**: Comprehensive user manual
- **CHANGELOG.md**: Development tracking (this file)
- **ANALYSIS_REPORT.md**: Initial codebase analysis
- **BLUEPRINT_COMPLETE.md**: Full specification document

### Changed

#### Orders Module (orders.js)
- Now uses `App.Services.NumberSequence.nextOrderNumber()` for sequential IDs
- Includes `createdBy` field tracking current user

#### Documents Module (documents.js)
- Uses NumberSequence service for delivery note and invoice numbers
- Improved document generation workflow

#### Production Module (production.js)
- Uses NumberSequence service for production order numbers
- Default status changed from undefined to 'planned'
- Enhanced BOM component tracking

#### Settings Page (settings.js)
- Complete redesign with two-column layout
- Added user management section
- Added backup/restore section
- Improved form layout with grid system

#### Router (router.js)
- Added role-based permission checking before navigation
- Browser history integration with pushState
- Graceful handling of unauthorized access

#### Database Layer (db.js)
- Enhanced `normalizeData()` with complete config schema
- Added `exportBackup()` method
- Added `importBackup()` method
- Improved seed data with proper user defaults

#### Styles (layout.css)
- Added lock screen styles (.lock-screen, .lock-card, .lock-icon, .lock-title, .lock-user)
- Added shake animation for invalid PIN feedback
- Responsive adjustments for lock screen

#### Index HTML (index.html)
- Added lock screen overlay markup
- Added "Remember me" checkbox to login
- Integrated unlock button handlers

### Fixed

- Data inconsistency between uppercase/lowercase property names
- Missing default values for new config properties
- Proper initialization of numberSequences object

### Security

- PIN-based authentication with 4-digit requirement
- Auto-lock prevents unauthorized access to unlocked sessions
- Role permissions enforced at router level

---

## [0.1.1] - 2025-11-22

### Added

#### App.Api Data Access Layer (js/api.js)
- **Abstraction Layer**: All data operations abstracted for future backend migration
- **Collection CRUD**: Generic create, read, update, delete for all entities
- **Filtering & Pagination**: list() with where, orderBy, limit, offset support
- **Bulk Operations**: bulkCreate, bulkUpdate, bulkDelete methods
- **Custom Methods**:
  - `customers.getBySegment()`
  - `products.getLowStock()`, `products.adjustStock()`
  - `orders.getByStatus()`, `orders.getByCustomer()`, `orders.updateStatus()`
  - `documents.getByOrder()`, `documents.getByType()`
  - `productionOrders.getActive()`, `productionOrders.complete()`
  - `movements.getByProduct()`, `movements.getByDateRange()`
  - `priceLists.getActiveForCustomer()`, `priceLists.getPriceForProduct()`
- **Dashboard Aggregations**: `dashboard.getStats()`, `getRecentOrders()`, `getRecentDocuments()`
- **Reports API**: `reports.getSalesByPeriod()`, `getInventoryValue()`, `getTopCustomers()`, `getTopProducts()`
- **Config API**: `configApi.get()`, `configApi.update()`
- **Dual Mode Support**: Can switch between 'local' (localStorage) and 'remote' (REST API)

### Changed

- Updated index.html to load js/api.js

---

## [0.2.0] - 2025-11-22

### Phase 2.1: Price List Cascade - Complete

### Added

#### PriceCascade Service (js/app.js)
- **Cascade Logic**: Customer-specific → Segment → Product Default
- **getPrice()**: Main lookup function with quantity support
- **Volume Discounts**: Support for quantity-based discounts (percent or fixed)
- **getAllPricesForCustomer()**: Preview all prices for a customer
- **comparePrices()**: Compare prices across sources for a product
- **calculateLineTotal()**: Calculate line with VAT using cascade pricing
- **Date Validation**: Checks validFrom/validTo for price list validity

#### Enhanced Pricing Page (js/pages/pricing.js)
- **Status Badges**: Active, Scheduled, Expired, Inactive
- **Edit Button**: Full edit capability for existing price lists
- **Delete Button**: Delete with confirmation dialog
- **Scope Display**: Shows customer name or segment name
- **Item Count**: Shows number of price entries per list
- **Type Icons**: Visual indicators for Customer/Segment/Default lists

#### Dynamic Order Pricing (js/pages/orders.js)
- **PriceCascade Integration**: Prices auto-calculated using cascade service
- **Customer Change Handler**: Recalculates all prices when customer changes
- **Quantity Support**: Passes quantity for volume discount calculations

### Phase 2.4: Stock Validation - Complete

#### Stock Validation in Orders (js/pages/orders.js)
- **Real-time Stock Display**: Shows available stock for each line item
- **Insufficient Stock Warning**: Red warning when qty exceeds stock
- **Low Stock Alert**: Amber warning when stock is at/below minimum
- **Save Confirmation**: Modal dialog when saving with stock issues
- **Stock Movement Recording**: Automatic movement records for sales
- **Remove Item Button**: Can remove line items from order
- **Improved UI**: Card-style line items with better spacing

### Phase 2.5: BOM (Recipe) Support - Complete

#### Product BOM Management (js/pages/products.js)
- **Complete Rewrite**: Uses correct data structure with full field support
- **BOM Editor Modal**: Define components per unit for each product
- **BOM Count Display**: Shows component count in product list
- **Product Types**: Finished, Device, Consumable, Part, Service
- **Multi-Language Names**: German and English product names
- **Pricing Tiers**: Purchase, Dealer, End Customer prices
- **Stock Management**: Current stock and minimum stock levels

#### Auto-BOM in Production (js/pages/production.js)
- **Auto-Load BOM**: Components populate when product selected
- **Quantity Calculation**: Total qty = quantityPerUnit × PO quantity
- **Toast Notification**: Confirms BOM loaded with component count
- **Quantity Change Recalc**: Updates totals when PO quantity changes

### Phase 3: Dashboard Improvements - Complete

#### Enhanced Dashboard (js/pages/dashboard.js)
- **Revenue from Invoices**: Calculates from actual invoices, not orders
- **Open Orders Count**: Shows unfulfilled orders with blue highlight
- **Pending Production**: Shows incomplete production orders with amber
- **Recent Orders Section**: Last 5 orders with customer and amounts
- **Low Stock Alerts**: Top 5 low stock items with details
- **Recent Documents Table**: Latest invoices and delivery notes
- **Navigation Buttons**: Quick links to Orders and Inventory

---

## [0.4.0] - 2025-11-22

### Phase 4: Batch/LOT Management - Complete

#### Batch Management Page (js/pages/batches.js)
- **LOT Number Generation**: Auto-generated format YYMMDD-XXX
- **Product & Component Batches**: Support for both types
- **Expiry Date Tracking**: With status badges for expired/expiring
- **QC Workflow**: Pending → Quarantine → Released/Rejected
- **QC Modal**: Inspector, date, notes, status update
- **Traceability Modal**: Forward and reverse traceability
- **Stock Movement Link**: Track batch in movements
- **Supplier LOT Reference**: For received goods

#### Integration
- **Sidebar Navigation**: Added batches under Inventory section
- **Role Permissions**: Admin, Warehouse, Production can access
- **i18n Support**: German and English translations
- **Data Model**: Added batches collection to db.js

---

## [0.5.0] - 2025-11-22

### Phase 5: Purchase Orders - Complete

#### Purchase Orders Page (js/pages/purchaseOrders.js)
- **PO Number Generation**: Auto-generated format PO-YYYY-XXXX
- **Supplier Selection**: Dropdown with all suppliers
- **Line Items**: Support for both components and products
- **Status Workflow**: Draft → Sent → Confirmed → Received → Closed
- **Status Badges**: Color-coded status indicators
- **Receive Order**: Updates stock and creates purchase movements
- **Expected/Received Dates**: Date tracking for delivery
- **Total Calculation**: Auto-calculates line totals and PO total
- **View Details**: Modal to view complete PO information

#### Integration
- **Sidebar Navigation**: Added purchaseOrders under Inventory section
- **Role Permissions**: Admin, Warehouse can access
- **i18n Support**: German and English translations
- **Data Model**: Added purchaseOrders collection to db.js

---

## [0.5.1] - 2025-11-22

### Supplier Management Enhancements - Complete

#### Enhanced Suppliers Page (js/pages/suppliers.js)
- **Extended Fields**: Payment terms, lead time, minimum order value, currency, VAT ID, rating
- **Performance Tracking**: Order count, on-time delivery rate, total spend per supplier
- **Supplier Code**: Unique identifier for each supplier
- **Delete Protection**: Cannot delete suppliers with linked purchase orders
- **Better Modal**: Two-column layout with business terms section

#### Enhanced Components Page (js/pages/components.js)
- **Preferred Supplier**: Link components to preferred suppliers with lead time display
- **Purchase Price**: Track purchase price per component
- **Reorder Management**: Reorder point and reorder quantity fields
- **Min Order Qty**: Minimum order quantity for suppliers
- **Supplier Part Number**: Track supplier's internal part number
- **Stock Status Badges**: Visual indicators for stock levels (OK/Low/Out)
- **Delete Protection**: Cannot delete components used in product BOMs

---

## [0.6.0] - 2025-11-22

### Financial Management - Complete

#### Payment Tracking (js/pages/documents.js)
- **Due Date Calculation**: Auto-calculated from payment terms (Net 7/15/30/45/60)
- **Payment Status**: Open, Partial, Paid, Overdue with color-coded badges
- **Record Payments**: Modal to record payments with amount, date, method, reference
- **Payment History**: View all payments for an invoice with running totals
- **Multiple Payment Methods**: Bank transfer, cash, credit card, cheque, PayPal
- **Printed Invoice Updates**: Shows paid amount and balance due

#### Dashboard Enhancements (js/pages/dashboard.js)
- **Overdue Invoices Card**: Shows total overdue amount with visual alert
- **Unpaid Invoices Card**: Shows outstanding invoice amounts
- **Overdue Invoice List**: Top 5 overdue invoices with days overdue
- **Payment Status in Documents**: Color-coded status badges throughout

---

## [0.6.1] - 2025-11-22

### Sequential Customer Numbering - Complete

#### Customer Number Generation (js/app.js)
- **Auto-Generated Customer Numbers**: Format K-YYYY-XXXX (e.g., K-2025-0001)
- **Sequence in NumberSequence Service**: Persistent counter in config.numberSequences
- **getCurrentNumbers() Updated**: Includes lastCustomerNumber for settings display

#### Enhanced Customers Page (js/pages/customers.js)
- **Customer Number Display**: Shows customer number in list and edit modal
- **Auto-Assign on Create**: New customers automatically get sequential number
- **Table Layout**: Improved table view with all key fields
- **Segment Field**: Premium, Standard, Basic, Retail, Wholesale
- **Payment Terms**: Net 7/15/30/45/60, COD, Prepaid
- **Address Roles**: Main, Billing, Shipping address types
- **Delete Protection**: Cannot delete customers with linked orders
- **Better Modal**: Two-column layout with organized sections

---

## [Unreleased]

### Planned for Version 0.7.0

#### Enhanced Order Wizard
- [ ] Multi-step order creation flow
- [ ] Carrier/shipping integration
- [ ] Discount management
- [ ] Line-level notes and customization

#### Partial Deliveries
- [ ] Split shipments support
- [ ] Remaining quantity tracking
- [ ] Multiple delivery notes per order
- [ ] Partial invoice generation

### Planned for Version 0.7.0 (UX/Performance)

- [ ] Loading states and spinners
- [ ] Pagination for large datasets
- [ ] Dashboard charts and visualizations
- [ ] Keyboard shortcuts system
- [ ] Toast notification improvements

### Planned for Version 0.8.0 (Polish)

- [ ] Comprehensive testing suite
- [ ] Error monitoring and logging
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Final documentation polish

### Future Considerations

#### Backend Integration
- [ ] App.Api data access layer (abstraction for backend migration)
- [ ] Node.js/Express REST API
- [ ] PostgreSQL database schema
- [ ] Migration scripts from localStorage
- [ ] Real-time sync capabilities

#### AI Integration
- [ ] Demand forecasting
- [ ] Stock optimization suggestions
- [ ] Anomaly detection
- [ ] Natural language queries

---

## Development Notes

### Architecture Decisions

1. **Offline-First**: All data in localStorage for zero-server dependency
2. **No Frameworks**: Vanilla JS (ES6+) for minimal footprint and maintainability
3. **Modular Design**: Clear separation between DB, Services, UI, and Router
4. **Progressive Enhancement**: Built to support future backend without rewriting UI

### Code Conventions

- Namespace: `App.{Module}.{Component}`
- Storage: Normalized lowercase keys
- IDs: `{prefix}_{timestamp}_{random}` format
- Dates: ISO 8601 strings

### Testing

Manual testing completed for:
- [x] User login/logout flow
- [x] Session lock/unlock
- [x] User CRUD operations
- [x] Backup export
- [x] Backup import
- [x] Order creation with sequential numbering
- [x] Document generation
- [x] Production order completion

### Known Limitations

1. localStorage has ~5-10MB limit depending on browser
2. No offline-to-online sync mechanism yet
3. Single-user per browser session
4. Manual price entry (no automatic price list lookup yet)

---

## Contributors

- Initial Development: Claude AI Assistant
- Project Owner: User

---

## References

- [MICROOPS_SPEC.md](./MICROOPS_SPEC.md) - Original specification
- [BLUEPRINT_COMPLETE.md](./BLUEPRINT_COMPLETE.md) - Complete implementation blueprint
- [ANALYSIS_REPORT.md](./ANALYSIS_REPORT.md) - Initial code analysis
- [HowToUse.md](./HowToUse.md) - User manual
