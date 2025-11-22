# MicroOps ERP - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

### Planned for Version 0.5.0

#### Purchase Orders
- [ ] PO data model (header + lines)
- [ ] Creating POs for suppliers
- [ ] Status workflow (Draft → Sent → Received → Closed)
- [ ] Link POs to sales orders

#### Financial Management
- [ ] Payment tracking
- [ ] Due date alerts
- [ ] Overdue management

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

#### Stock Validation
- [ ] Real-time availability warnings
- [ ] Prevent overselling
- [ ] Low stock alerts on order entry
- [ ] Suggested alternatives for out-of-stock items

### Planned for Version 0.3.0 (Phase 3: UX/Performance)

- [ ] Loading states and spinners
- [ ] Pagination for large datasets
- [ ] Dashboard charts and visualizations
- [ ] Keyboard shortcuts system
- [ ] Toast notification improvements

### Planned for Version 0.4.0 (Phase 4: Polish)

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
