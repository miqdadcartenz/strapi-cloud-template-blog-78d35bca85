'use strict';

/**
 * Menambah permission Public untuk API Mega Menu.
 *
 * Usage: node ./scripts/add-mega-menu-permissions.js
 * (Jalankan dari folder root Strapi, pastikan .env sudah benar.)
 */

async function setMegaMenuPublicPermissions(strapi) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    console.error('Public role tidak ditemukan.');
    return;
  }

  const actionStr = 'api::mega-menu.mega-menu.find';
  const existing = await strapi.query('plugin::users-permissions.permission').findOne({
    where: { action: actionStr, role: publicRole.id },
  });

  if (!existing) {
    await strapi.query('plugin::users-permissions.permission').create({
      data: {
        action: actionStr,
        role: publicRole.id,
        enabled: true,
      },
    });
    console.log('Permission public ditambahkan:', actionStr);
  } else {
    console.log('Permission public sudah ada:', actionStr);
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await setMegaMenuPublicPermissions(app);
  await app.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

