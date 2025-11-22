# MicroOps ERP Backend

Production-ready Node.js/Express backend with PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create PostgreSQL database:
```sql
CREATE DATABASE microops_erp;
CREATE USER microops WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE microops_erp TO microops;
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
npm run migrate
```

5. Seed initial data:
```bash
npm run seed
```

6. Start server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/change-password

### Customers
- GET /api/customers
- GET /api/customers/:id
- POST /api/customers
- PUT /api/customers/:id
- DELETE /api/customers/:id

### Products
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

### Orders
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PUT /api/orders/:id
- POST /api/orders/:id/confirm
- POST /api/orders/:id/ship

### Documents
- GET /api/documents
- GET /api/documents/:id
- POST /api/documents/from-order/:orderId
- POST /api/documents/:id/post
- GET /api/documents/:id/pdf

### Inventory
- GET /api/inventory/products
- GET /api/inventory/components
- POST /api/inventory/adjust
- GET /api/inventory/movements
- GET /api/inventory/alerts

### Audit
- GET /api/audit
- GET /api/audit/record/:table/:id
- GET /api/audit/stats

### Backup
- POST /api/backup/create
- GET /api/backup/list
- GET /api/backup/download/:filename
- POST /api/backup/restore

### Config
- GET /api/config
- PUT /api/config/:key

## Security Features

- JWT authentication with bcrypt password hashing
- Role-based access control (admin, manager, sales, warehouse, readonly)
- Rate limiting
- Helmet security headers
- Complete audit trail with PostgreSQL triggers
- Automated backups with checksums

## Database Schema

See `utils/migrate.js` for complete schema including:
- Users and sessions
- Customers with credit limits
- Products and components
- Orders and order items
- Documents (invoices, delivery notes)
- Inventory movements
- Audit log with triggers
- Number sequences

## Production Deployment

1. Set strong JWT_SECRET
2. Enable SSL/TLS
3. Configure automated backups
4. Set up monitoring
5. Use process manager (PM2)
