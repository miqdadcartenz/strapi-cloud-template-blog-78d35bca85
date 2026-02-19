'use strict';

/**
 * Memperbaiki kolom `details` (tipe JSON) di tabel components_product_page_tab_contents
 * agar selalu berisi JSON array valid. Menghindari error "invalid input syntax for type json"
 * saat transfer ke Strapi Cloud (PostgreSQL).
 *
 * Jalankan: node scripts/fix-tab-content-json.js
 * Pastikan Strapi tidak sedang jalan saat script dijalankan (agar DB tidak terkunci).
 */

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '.tmp', 'data.db');
const tableName = 'components_product_page_tab_contents';

function main() {
  if (!require('fs').existsSync(dbPath)) {
    console.error('Database tidak ditemukan:', dbPath);
    console.error('Jalankan Strapi minimal sekali (npm run develop) agar .tmp/data.db terbentuk.');
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: false });

  try {
    let tableToUse = tableName;
    const tableInfo = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);

    if (!tableInfo) {
      // Coba nama dengan strip "components_" (beberapa setup pakai nama pendek)
      const altName = 'product_page_tab_contents';
      const altInfo = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(altName);
      if (altInfo) {
        tableToUse = altName;
      } else {
        console.log('Tabel', tableName, 'tidak ada. Jika data product-page disimpan di document (bukan tabel terpisah),');
        console.log('coba: 1) Hentikan Strapi, 2) Hapus folder .tmp, 3) Jalankan npm run develop, 4) npm run seed:example -- --force');
        console.log('untuk mengisi ulang dari data seed yang sudah valid.');
        return;
      }
    }

    const columns = db.prepare('PRAGMA table_info(' + tableToUse + ')').all();
    const hasDetails = columns.some((c) => c.name === 'details');
    if (!hasDetails) {
      console.log('Tabel tidak memiliki kolom "details". Tidak ada yang diperbaiki.');
      return;
    }

    const rows = db.prepare('SELECT id, details FROM ' + tableToUse).all();
    let fixed = 0;

    const updateStmt = db.prepare(
      'UPDATE ' + tableToUse + ' SET details = ? WHERE id = ?'
    );

    for (const row of rows) {
      let newValue = '[]';
      const current = row.details;

      if (current != null && current !== '') {
        try {
          const parsed = JSON.parse(current);
          if (Array.isArray(parsed)) {
            newValue = JSON.stringify(parsed);
          }
        } catch (_) {
          // Bukan JSON valid, pakai []
        }
      }

      if (current !== newValue) {
        updateStmt.run(newValue, row.id);
        fixed++;
      }
    }

    console.log('Selesai. Baris yang diperbaiki:', fixed, 'dari', rows.length);
  } finally {
    db.close();
  }
}

main();
