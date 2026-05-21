'use strict';

/**
 * Seed / merge collection type detail category (Smartgov, EFD, Palapa, Citigov, dll.)
 * Schema sama: categoryId, label, megaMenuChildId, sidebarAsFlat, order, subMenus.
 *
 * Usage:
 *   node ./scripts/seed-detail-category.js <modelUid> <jsonFile>
 *
 * jsonFile: nama file di root project Strapi, mis. smartgov-detail-category.json
 *
 * Per baris JSON:
 * - sidebarAsFlat: boolean (default false jika tidak diisi)
 * - subMenus: array (boleh 1 item; label & title boleh sama — subSlug dari title/slugify di generator JSON kamu)
 */

const fs = require('fs');
const path = require('path');

const modelUid = process.argv[2];
const jsonFile = process.argv[3];

if (!modelUid || !jsonFile) {
  console.error(
    'Usage: node ./scripts/seed-detail-category.js <modelUid> <jsonFile>\n' +
      'Contoh: node ./scripts/seed-detail-category.js api::efd-detail-category.efd-detail-category efd-detail-category.json'
  );
  process.exit(1);
}

const JSON_PATH = path.isAbsolute(jsonFile) ? jsonFile : path.join(__dirname, '..', jsonFile);

/** Populate dalam agar merge tidak menghapus nested (tabs, image, dynamic zone blocks). */
const FIND_OPTIONS = {
  populate: {
    subMenus: {
      populate: {
        tabs: {
          populate: {
            content: {
              populate: {
                image: true,
                blocks: {
                  on: {
                    'product-page.block-list': true,
                    'product-page.block-paragraph': true,
                    'product-page.block-heading': true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function loadJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Format JSON harus berupa array.');
  }

  return data;
}

function normalizeEntry(entry) {
  return {
    categoryId: entry.categoryId,
    label: entry.label,
    megaMenuChildId: entry.megaMenuChildId,
    sidebarAsFlat: typeof entry.sidebarAsFlat === 'boolean' ? entry.sidebarAsFlat : false,
    order: Number.isInteger(entry.order) ? entry.order : null,
    subMenus: Array.isArray(entry.subMenus) ? entry.subMenus : [],
    publishedAt: new Date().toISOString(),
  };
}

/**
 * @param {unknown} sm
 * @returns {string}
 */
function getSubSlug(sm) {
  if (!sm || typeof sm !== 'object') return '';
  /** @type {{ subSlug?: unknown }} */
  const o = sm;
  if (typeof o.subSlug === 'string') return o.subSlug.trim();
  if (o.subSlug != null) return String(o.subSlug).trim();
  return '';
}

/**
 * @param {unknown} subMenus
 * @returns {Set<string>}
 */
function collectExistingSubSlugs(subMenus) {
  const set = new Set();
  if (!Array.isArray(subMenus)) return set;
  for (const sm of subMenus) {
    const slug = getSubSlug(sm);
    if (slug) set.add(slug);
  }
  return set;
}

/**
 * @param {unknown[]} list
 * @returns {unknown[]}
 */
function dedupeIncomingSubMenus(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const sm of list) {
    const slug = getSubSlug(sm);
    if (!slug) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push(sm);
  }
  return out;
}

async function seedDetailCategory() {
  const rows = loadJsonFile(JSON_PATH);
  let created = 0;
  let updated = 0;
  let subMenusAdded = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row || typeof row !== 'object') {
      skipped++;
      console.log('Skip: item bukan object valid.');
      continue;
    }

    const categoryId = typeof row.categoryId === 'string' ? row.categoryId.trim() : '';
    const label = typeof row.label === 'string' ? row.label.trim() : '';

    if (!categoryId || !label) {
      skipped++;
      console.log('Skip: categoryId/label kosong.');
      continue;
    }

    const incomingSubMenus = dedupeIncomingSubMenus(row.subMenus);

    const existing = await strapi.documents(modelUid).findFirst({
      where: { categoryId },
      ...FIND_OPTIONS,
    });

    if (!existing) {
      await strapi.documents(modelUid).create({
        data: normalizeEntry({ ...row, subMenus: incomingSubMenus }),
      });
      created++;
      console.log(`Created: ${categoryId} (${incomingSubMenus.length} subMenu)`);
      continue;
    }

    const existingList = Array.isArray(existing.subMenus) ? existing.subMenus : [];
    const existingSlugs = collectExistingSubSlugs(existingList);
    const toAdd = incomingSubMenus.filter((sm) => {
      const slug = getSubSlug(sm);
      return Boolean(slug) && !existingSlugs.has(slug);
    });

    if (toAdd.length === 0) {
      console.log(`Skip merge: ${categoryId} (semua subSlug sudah ada)`);
      continue;
    }

    const documentId = existing.documentId ?? existing.id;
    if (!documentId) {
      skipped++;
      console.error(`Error: tidak ada documentId untuk categoryId=${categoryId}`);
      continue;
    }

    await strapi.documents(modelUid).update({
      documentId,
      data: {
        subMenus: [...existingList, ...toAdd],
      },
    });
    updated++;
    subMenusAdded += toAdd.length;
    console.log(
      `Merged: ${categoryId} (+${toAdd.length} subMenu baru, ${incomingSubMenus.length - toAdd.length} subSlug sudah ada di CMS)`
    );
  }

  console.log(
    `[${modelUid}] Selesai. Created=${created}, Merged=${updated}, subMenusAdded=${subMenusAdded}, SkippedInvalid=${skipped}, Total=${rows.length}`
  );
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  try {
    app.log.level = 'error';
    await seedDetailCategory();
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
