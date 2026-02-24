'use strict';

/**
 * Menambah permission Public untuk API halaman produk (smartgov, efd, palapa, strategic-consulting).
 * Jalankan sekali jika frontend dapat 403 Forbidden saat fetch API produk.
 *
 * Usage: node ./scripts/add-product-permissions.js
 * (Jalankan dari folder root Strapi, pastikan .env sudah benar.)
 */

const path = require('path');

const productPermissions = {
  'smartgov-page': ['find', 'findOne'],
  'smartgov-detail-category': ['find', 'findOne'],
  'efd-page': ['find', 'findOne'],
  'efd-detail-category': ['find', 'findOne'],
  'palapa-page': ['find', 'findOne'],
  'palapa-detail-category': ['find', 'findOne'],
  'strategic-consulting-page': ['find', 'findOne'],
};

async function setProductPublicPermissions(strapi) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    console.error('Public role tidak ditemukan.');
    return;
  }

  let added = 0;
  for (const controller of Object.keys(productPermissions)) {
    for (const action of productPermissions[controller]) {
      const actionStr = `api::${controller}.${controller}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: actionStr, role: publicRole.id },
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action: actionStr, role: publicRole.id },
        });
        console.log('  +', actionStr);
        added++;
      }
    }
  }
  console.log('Selesai. Permission ditambah:', added);
}

async function main() {
  process.chdir(path.join(__dirname, '..'));
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';
  console.log('Menambah permission Public untuk API produk...');
  await setProductPublicPermissions(app);
  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
