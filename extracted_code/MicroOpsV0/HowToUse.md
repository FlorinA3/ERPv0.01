# MicroOps ERP - User Manual

**Version 0.1.0** | Last Updated: 2025-11-22

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
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

MicroOps ERP is a lightweight, offline-first Enterprise Resource Planning system designed for small to medium manufacturing and distribution businesses. Built with modern web technologies, it runs entirely in your browser without requiring a server connection.

### Key Features

- **Offline-First**: Works without internet connection using browser localStorage
- **Multi-Language**: Supports English (EN), German (DE), and Romanian (RO)
- **Role-Based Access**: Different permissions for Admin, Sales, Warehouse, and Production roles
- **Session Security**: Auto-lock feature and PIN-based authentication
- **Document Generation**: Create invoices and delivery notes with professional formatting

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

All data is stored in your browser's localStorage under the key `MicroOps_DB_V4`. This means:
- Data persists across browser sessions
- Data is specific to each browser/device
- Clearing browser data will erase your ERP data
- **Always create regular backups!**

---

## Login & Authentication

### Login Process

1. Select your username from the dropdown
2. Enter your 4-digit PIN
3. Optionally check "Remember me" to stay logged in
4. Click **Login**

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

### Creating a Backup

Regular backups protect your data. To create a backup:

1. Go to **Settings**
2. Click **📥 Download Backup**
3. A JSON file downloads: `microops_backup_2025-11-22T10-30-00.json`
4. Store this file safely

### Restoring a Backup

To restore from a backup:

1. Go to **Settings**
2. Click **📤 Restore Backup**
3. Select your backup JSON file
4. The system will:
   - Validate the file
   - Restore all data
   - Refresh the application

**Warning**: Restoring a backup replaces ALL current data!

### Backup Best Practices

- Create daily backups
- Store backups in multiple locations
- Test restores periodically
- Keep at least 7 days of backup history

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

### Data Not Saving

**Problem**: Changes don't persist
- Check browser localStorage is not full
- Ensure cookies/local storage are enabled
- Try a different browser

### Document Generation Fails

**Problem**: Cannot create invoice/delivery
- Ensure order has a valid customer
- Check customer has at least one address
- Verify all products in order exist

### Performance Issues

**Problem**: Application is slow
- Reduce number of records displayed
- Clear old/unused data
- Create backup and start fresh if needed

### Resetting the Application

If you need to completely reset:

1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage
4. Refresh the page
5. System will reload with sample data

---

## Support

For technical support or feature requests, please contact your system administrator.

---

**MicroOps ERP** - Simple, Fast, Offline-First

© 2025 MicroOps Global
