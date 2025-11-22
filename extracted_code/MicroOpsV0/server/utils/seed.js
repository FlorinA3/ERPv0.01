require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function seed() {
  console.log('Seeding database...');

  try {
    const adminPassword = await bcrypt.hash('admin123', 10);

    await pool.query(`
      INSERT INTO users (username, password_hash, name, email, role)
      VALUES ('admin', $1, 'Administrator', 'admin@microops.local', 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword]);

    console.log('Created admin user (username: admin, password: admin123)');

    await pool.query(`
      INSERT INTO categories (name, description) VALUES
        ('Fertigprodukte', 'Verkaufsfertige Produkte'),
        ('Rohstoffe', 'Eingekaufte Rohstoffe'),
        ('Verpackung', 'Verpackungsmaterial')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('Created default categories');

    await pool.query(`
      INSERT INTO config (key, value) VALUES
        ('company', '{"name": "DF-Pure GmbH", "address": "Musterstraße 1", "city": "Wien", "postalCode": "1010", "country": "AT", "vatNumber": "ATU12345678"}'),
        ('invoicing', '{"defaultPaymentTerms": 30, "defaultVatRate": 20}'),
        ('ui', '{"theme": "dark", "language": "de", "dateFormat": "DD.MM.YYYY"}')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Created default config');
    console.log('Seeding completed successfully');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
