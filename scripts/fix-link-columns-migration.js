'use strict';

/**
 * Menghapus kolom link_artikel / link_produk yang sudah ada di DB agar Strapi
 * tidak error "column already exists" saat migration.
 * Setelah dijalankan, jalankan lagi `npm run develop` — Strapi akan menambah kolom tersebut sekali.
 *
 * Usage: node ./scripts/fix-link-columns-migration.js
 * (Jalankan dari folder root Strapi, pastikan .env sudah benar.)
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'strapi',
    user: process.env.DATABASE_USERNAME || 'strapi',
    password: process.env.DATABASE_PASSWORD || 'strapi',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query('ALTER TABLE articles DROP COLUMN IF EXISTS link_artikel;');
    console.log('Dropped column articles.link_artikel (if existed).');
    await client.query('ALTER TABLE products DROP COLUMN IF EXISTS link_produk;');
    console.log('Dropped column products.link_produk (if existed).');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
