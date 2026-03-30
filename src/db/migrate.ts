import pg from "pg";
import { config } from "../config/index.js";

async function migrate() {
  const adminClient = new pg.Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: "postgres",
  });

  await adminClient.connect();

  const dbCheck = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [config.db.database]
  );

  if (dbCheck.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE ${config.db.database}`);
    console.log(`Database "${config.db.database}" created.`);
  } else {
    console.log(`Database "${config.db.database}" already exists.`);
  }

  await adminClient.end();

  const client = new pg.Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      brand VARCHAR(255) NOT NULL DEFAULT '',
      category_id VARCHAR(100) NOT NULL DEFAULT '',
      name VARCHAR(500) NOT NULL,
      name_en VARCHAR(500) NOT NULL,
      description TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      image VARCHAR(500) DEFAULT '',
      brochure VARCHAR(500) DEFAULT '',
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      is_new BOOLEAN NOT NULL DEFAULT FALSE,
      has_warranty BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='category_id') THEN
        ALTER TABLE products ADD COLUMN category_id VARCHAR(100) NOT NULL DEFAULT '';
      END IF;
    END $$
  `);

  await client.query(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS has_warranty BOOLEAN NOT NULL DEFAULT TRUE`
  );

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_features (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      feature VARCHAR(500) NOT NULL,
      feature_en VARCHAR(500) NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_specifications (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      spec_key VARCHAR(255) NOT NULL,
      spec_value VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `);

  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
        CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      END IF;
    END $$
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_updated_at') THEN
        CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      END IF;
    END $$
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS information_items (
      id SERIAL PRIMARY KEY,
      image VARCHAR(500) NOT NULL DEFAULT '',
      title_mn VARCHAR(500) NOT NULL DEFAULT '',
      title_en VARCHAR(500) NOT NULL DEFAULT '',
      description_mn TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'information_items_updated_at') THEN
        CREATE TRIGGER information_items_updated_at BEFORE UPDATE ON information_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
      END IF;
    END $$
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS product_inquiries (
      id SERIAL PRIMARY KEY,
      organization_name VARCHAR(500) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) DEFAULT '',
      product_name VARCHAR(500) NOT NULL,
      product_id INT REFERENCES products(id) ON DELETE SET NULL,
      brand VARCHAR(255) DEFAULT '',
      requirements TEXT DEFAULT '',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='product_inquiries' AND column_name='is_read') THEN
        ALTER TABLE product_inquiries ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;
    END $$
  `);

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='product_inquiries' AND column_name='inquiry_type') THEN
        ALTER TABLE product_inquiries ADD COLUMN inquiry_type VARCHAR(20) NOT NULL DEFAULT 'product' CHECK (inquiry_type IN ('product', 'service'));
      END IF;
    END $$
  `);

  await client.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='product_inquiries') THEN
        ALTER TABLE product_inquiries DROP CONSTRAINT IF EXISTS product_inquiries_inquiry_type_check;
        ALTER TABLE product_inquiries ADD CONSTRAINT product_inquiries_inquiry_type_check
          CHECK (inquiry_type IN ('product', 'service', 'contact'));
      END IF;
    END $$
  `);

  console.log("Migration complete!");
  console.log("Tables: users, products, product_features, product_specifications, information_items, product_inquiries");

  await client.end();
}

migrate().catch(console.error);
