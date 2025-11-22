# MicroOps ERP - User Manual

**Version 0.4.0** | Last Updated: 2025-11-22

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Login & Authentication](#login--authentication)
4. [Dashboard](#dashboard)
5. [Core Modules](#core-modules)
   - [Customers](#customers)
   - [Products](#products)
   - [Inventory](#inventory)
   - [Orders](#orders)
   - [Documents](#documents)
   - [Production](#production)
6. [Settings & Administration](#settings--administration)
7. [Data Backup & Restore](#data-backup--restore)
8. [Audit Trail](#audit-trail)
9. [System Health & Monitoring](#system-health--monitoring)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

MicroOps ERP is a lightweight, offline-first Enterprise Resource Planning system designed for small to medium manufacturing and distribution businesses. Built with modern web technologies, it runs entirely in your browser without requiring a server connection.

### Key Features

- **Offline-First**: Works without internet using IndexedDB (100MB+) with localStorage fallback
- **Multi-Language**: Supports English (EN), German (DE), and Romanian (RO)
- **Role-Based Access**: Different permissions for Admin, Sales, Warehouse, and Production roles
- **Session Security**: Auto-lock, PIN authentication, rate limiting, and session timeout warnings
- **Document Generation**: Create invoices and delivery notes with professional formatting
- **Audit Trail**: Complete change tracking with field-level comparison and export
- **Backup System**: Auto-backup on exit, 7 rolling backups, optional encryption
- **System Health**: Built-in health monitoring and data integrity validation

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Minimum 1920x1080 screen resolution recommended

### First Launch

1. Open `index.html` in your browser
2. On first run, sample data will be loaded automatically
3. Log in with the default admin account:
   - **Name**: Admin
   - **PIN**: 1234

### Data Storage

Data is stored in your browser using IndexedDB (primary) with localStorage fallback:
- **IndexedDB**: 100MB+ capacity, used for main data storage
- **localStorage**: 5-10MB capacity, used as automatic fallback
- Data persists across browser sessions
- Data is specific to each browser/device
- Clearing browser data will erase your ERP data
- **Auto-backup protects your data** on browser close (7 rolling backups kept)

---

## Login & Authentication

### Login Process

1. Select your username from the dropdown
2. Enter your 4-digit PIN
3. Optionally check "Remember me" to stay logged in
4. Click **Login**

### Security Features

**Rate Limiting**:
- After 5 failed login attempts, the account is locked for 5 minutes
- A countdown timer shows remaining lockout time
- Failed attempts are logged to the audit trail

**Session Management**:
- Sessions automatically expire after 30 minutes of inactivity
- A warning appears 5 minutes before timeout
- Click "Extend Session" to stay logged in

### Session Lock

For security, your session will automatically lock after a period of inactivity (default: 30 minutes).

When locked:
- A lock screen appears over the application
- Enter your PIN to unlock
- Or click "Logout" to end your session

### User Roles & Permissions

| Role | Access Areas |
|------|-------------|
| **Admin** | All modules and settings |
| **Sales** | Dashboard, Customers, Products, Pricing, Orders, Documents, Reports, Tasks |
| **Warehouse** | Dashboard, Inventory, Movements, Components, Suppliers, Carriers, Production, Tasks |
| **Production** | Dashboard, Production, Components, Inventory, Movements, Tasks |

---

## Dashboard

The Dashboard provides a quick overview of your business:

- **Total Revenue**: Sum of all invoiced amounts
- **Open Orders**: Number of orders not yet fulfilled
- **Low Stock Alerts**: Products below minimum stock levels
- **Recent Activity**: Latest orders and documents

---

## Core Modules

### Customers

Manage your customer database with full contact and billing information.

#### Adding a Customer

1. Navigate to **Customers**
2. Click **+ Add Customer**
3. Fill in required fields:
   - Company name
   - Contact person
   - Email
   - Phone
4. Add addresses (billing, shipping)
5. Set payment and delivery terms
6. Click **Save**

#### Customer Fields

- **Company**: Legal company name
- **Contact**: Primary contact person
- **VAT Number**: Tax identification number
- **Payment Terms**: Default payment conditions (e.g., "Net 30")
- **Delivery Terms**: Default shipping terms (e.g., "DAP")
- **Customer Segment**: For pricing tiers (Dealer, Direct, etc.)

---

### Products

Manage your product catalog with multi-language descriptions and pricing.

#### Product Types

- **Physical Products**: Items with stock tracking
- **Services**: Non-stock items (labor, consulting, etc.)

#### Product Fields

- **Internal Article Number**: Your SKU/part number
- **Name (DE/EN)**: Product name in German and English
- **Description**: Detailed product description
- **Unit**: Unit of measure (Stk, kg, m, etc.)
- **Average Purchase Price**: Cost price
- **Dealer Price**: Default selling price
- **Stock**: Current inventory quantity
- **Min Stock**: Reorder point alert threshold

---

### Inventory

Track stock levels and movements across your products.

#### Stock Movements

The system automatically records:
- **IN movements**: From production completion or manual adjustments
- **OUT movements**: From order fulfillment or production consumption

#### Manual Stock Adjustment

1. Go to **Inventory**
2. Find the product
3. Click the edit button
4. Adjust stock quantity
5. Save changes

---

### Orders

Create and manage sales orders.

#### Creating an Order

1. Navigate to **Orders**
2. Click **+ Create Order**
3. Select customer
4. Add line items:
   - Select product
   - Enter quantity
   - Price auto-fills from product
5. Review total (includes 20% VAT)
6. Click **Save**

#### Order Numbering

Orders are automatically numbered with format: `A2025-XXXX`
- A = Order prefix
- 2025 = Year
- XXXX = Sequential number

#### Order Workflow

1. **Confirmed**: Order saved and stock reserved
2. **Shipped**: Delivery note generated
3. **Paid**: Invoice paid and closed

#### Generating Documents

From the Orders list, click:
- 📦 to generate a **Delivery Note**
- 🧾 to generate an **Invoice**

---

### Documents

View and print invoices and delivery notes.

#### Document Types

| Type | Format | Example |
|------|--------|---------|
| Delivery Note | L + Year + 5 digits | L202500059 |
| Invoice | R + Year + 5 digits | R202500069 |

#### Creating Documents

**From Order:**
1. Go to Orders
2. Click 📦 or 🧾 on the order row

**Manual:**
1. Go to Documents
2. Click **+ Delivery Note** or **+ Invoice**
3. Select source (Order or Manual)
4. Click **Generate**

#### Printing Documents

1. Find the document in the list
2. Click 👁️ (View/Print)
3. A print-ready window opens
4. Click **PRINT** or use Ctrl+P

---

### Production

Manage production orders for manufacturing items.

#### Creating a Production Order

1. Navigate to **Production**
2. Click **+ Add**
3. Select product to manufacture
4. Enter quantity
5. Set planned start/end dates
6. Add BOM components (materials needed)
7. Click **Save**

#### Production Order Number Format

`PO-2025-XXX` (e.g., PO-2025-001)

#### Completing a Production Order

When production is finished:

1. Click ✅ on the order row
2. Confirm the completion dialog
3. The system will:
   - Add finished goods to stock
   - Deduct component materials from stock
   - Record all stock movements
   - Mark order as "completed"

#### Production Status

- **Planned**: Order created, not started
- **In Progress**: Production underway
- **Completed**: Finished and stock updated

---

## Settings & Administration

### Company Configuration

Configure your company details for document generation:

- Company name and address
- VAT and registration numbers
- Bank details (IBAN, BIC)
- Default payment/delivery terms
- Default VAT rate
- Currency

### User Management

#### Adding a User

1. Go to **Settings**
2. Click **+ Add User**
3. Enter:
   - Name
   - 4-digit PIN
   - Role
   - Preferred language
   - Preferred theme
4. Check "Active" to enable login
5. Click **Save**

#### Editing a User

1. Click ✏️ next to the user
2. Modify fields
3. Click **Save**

#### Deleting a User

1. Click 🗑️ next to the user
2. Confirm deletion
3. **Note**: Cannot delete the last admin user

---

## Data Backup & Restore

### Auto-Backup System

MicroOps automatically creates backups to protect your data:

- **Automatic Backup on Exit**: Saves when you close the browser tab
- **7 Rolling Backups**: Keeps the last 7 backups, automatically removes older ones
- **Integrity Verification**: Hash-based corruption detection

### Managing Backups

Access backup management in **Settings → Backups** tab:

1. **View Backups**: See all available backups with dates and sizes
2. **Restore Backup**: Click to restore from any backup
3. **Delete Backup**: Remove individual backups you no longer need
4. **Clear Old Backups**: Remove all but the most recent backup

### Creating a Manual Backup

1. Go to **Settings → Backups**
2. Click **📥 Download Backup**
3. Optionally enter a password for encryption
4. A JSON file downloads: `microops_backup_2025-11-22T10-30-00.json`
5. Store this file safely

### Encrypted Backups

For sensitive data, use encrypted backups:

1. When downloading, enter a password
2. The backup file will be encrypted
3. When restoring, you'll need the same password
4. **Remember your password** - it cannot be recovered!

### Restoring a Backup

To restore from a backup:

1. Go to **Settings → Backups**
2. Click **📤 Restore Backup**
3. Select your backup JSON file
4. If encrypted, enter the password
5. The system will:
   - Validate the file
   - Verify integrity hash
   - Restore all data
   - Refresh the application

**Warning**: Restoring a backup replaces ALL current data!

### Backup Best Practices

- Auto-backup keeps you protected automatically
- Download encrypted manual backups for offsite storage
- Store backups in multiple locations
- Test restores periodically

---

## Audit Trail

### Overview

MicroOps maintains a complete audit trail of all data changes for compliance and troubleshooting.

### What Gets Logged

- **CREATE**: New records added (customers, orders, products, etc.)
- **UPDATE**: Changes to existing records with old/new values
- **DELETE**: Records removed from the system
- **SECURITY**: Login attempts, account lockouts

### Viewing the Audit Trail

1. Go to **Settings → Audit Log**
2. Use filters to find specific entries:
   - **Date Range**: From/To dates
   - **Action**: CREATE, UPDATE, DELETE
   - **Entity Type**: customers, orders, products, etc.
   - **User**: Filter by who made the change
3. Click **Search** to apply filters

### Audit Entry Details

Each entry shows:
- **Timestamp**: When the change occurred
- **User**: Who made the change
- **Action**: What type of change
- **Entity**: What was changed
- **Changes**: Field-by-field comparison (for updates)

### Exporting Audit Data

For compliance or reporting:

1. Go to **Settings → Audit Log**
2. Apply any desired filters
3. Click **Export CSV**
4. A CSV file downloads with all matching entries

### Audit Trail Compliance

The audit trail supports:
- Austrian GoBD/GDPdU requirements
- Complete change tracking with timestamps
- Tamper detection via integrity checks
- Long-term retention for legal compliance

---

## System Health & Monitoring

### Overview

Monitor system health and detect potential issues before they cause problems.

### Running Health Checks

1. Go to **Settings → System Health**
2. Click **🔍 Run Health Check**
3. View results for each area:
   - **Storage**: Current usage vs capacity
   - **Backups**: Age of most recent backup
   - **Data Integrity**: Orphan records, invalid references
   - **Audit Size**: Number of audit entries

### Health Status Colors

- 🟢 **Green (Healthy)**: Everything normal
- 🟡 **Yellow (Warning)**: Attention recommended
- 🔴 **Red (Critical)**: Immediate action needed

### Storage Monitoring

- **Warning**: Storage exceeds 80% capacity
- **Critical**: Storage exceeds 95% capacity
- **Action**: Export and archive old data, clear audit logs

### Backup Age Monitoring

- **Warning**: No backup in last 24 hours
- **Critical**: No backup in last 72 hours
- **Action**: Create a manual backup or check auto-backup settings

### Data Integrity Checks

Click **⚙️ Run Integrity Check** to detect:
- Orders without valid customers
- Documents without valid orders
- Products with invalid BOM references
- Negative stock levels

### Quick Statistics

View at-a-glance metrics:
- Total records across all entities
- Audit trail entries
- Active user sessions

### Error Recovery

If the system encounters an error:
1. A user-friendly error message appears
2. All errors are logged to the audit trail
3. Click **Reload Application** to recover
4. Your data is automatically preserved

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal dialogs |
| `Enter` | Confirm/Submit in modals |
| `Ctrl+P` | Print (in document view) |

---

## Troubleshooting

### Login Issues

**Problem**: Cannot log in
- Verify PIN is exactly 4 digits
- Check user is marked as "Active"
- Try clearing browser cache

**Problem**: Account is locked
- Wait for the lockout countdown to finish (5 minutes)
- After lockout expires, retry with correct PIN
- Contact admin if you've forgotten your PIN

### Data Not Saving

**Problem**: Changes don't persist
- Check storage capacity in Settings → System Health
- IndexedDB may be full - export old data
- Ensure cookies/local storage are enabled
- Try a different browser

### Document Generation Fails

**Problem**: Cannot create invoice/delivery
- Ensure order has a valid customer
- Check customer has at least one address
- Verify all products in order exist

### Performance Issues

**Problem**: Application is slow
- Run health check in Settings → System Health
- Clear old audit entries if over 10,000
- Reduce number of records displayed
- Export old data and archive

### Storage Issues

**Problem**: Storage capacity warning
- Export data you no longer need
- Clear old audit trail entries
- Download and remove old backups
- Check Settings → System Health for details

### Application Errors

**Problem**: System shows error message
- Click "Reload Application" to recover
- Check Settings → Audit Log for error details
- Your data is preserved automatically
- Report persistent errors to admin

### Resetting the Application

If you need to completely reset:

1. Open browser Developer Tools (F12)
2. Go to Application → IndexedDB
3. Delete the MicroOps database
4. Also clear localStorage
5. Refresh the page
6. System will reload with sample data

---

## Support

For technical support or feature requests, please contact your system administrator.

---

**MicroOps ERP** - Simple, Fast, Offline-First

© 2025 MicroOps Global
