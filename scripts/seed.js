'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

const dataPath = path.join(__dirname, '..', 'data', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const { categories, authors, articles, global, about, homepage, products, clients, gallery } = data;

const forceReseed = process.argv.includes('--force');

async function seedExampleApp() {
  const shouldImportSeedData = forceReseed || (await isFirstRun());

  if (forceReseed) {
    console.log(
      '--force: mengabaikan pengecekan initHasRun, mengimpor seed...\n' +
        '  (Jika database sudah berisi data, sebaiknya kosongkan dulu untuk menghindari duplikat/error.)'
    );
  }

  if (shouldImportSeedData) {
    try {
      console.log('Setting up the template...');
      await importSeedData();
      console.log('Ready to go');
    } catch (error) {
      console.log('Could not import seed data');
      console.error(error);
    }
  } else {
    console.log(
      'Seed data has already been imported. We cannot reimport unless you clear your database first.'
    );
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  if (!forceReseed) {
    await pluginStore.set({ key: 'initHasRun', value: true });
  }
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) return;

  for (const controller of Object.keys(newPermissions)) {
    for (const action of newPermissions[controller]) {
      const actionStr = `api::${controller}.${controller}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: actionStr, role: publicRole.id },
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action: actionStr, role: publicRole.id },
        });
      }
    }
  }
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

const dataUploadsPath = path.join(__dirname, '..', 'data', 'uploads');

function fileExistsOnDisk(fileName) {
  return fs.existsSync(path.join(dataUploadsPath, fileName));
}

function getFileData(fileName) {
  const filePath = path.join(dataUploadsPath, fileName);
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry }) {
  try {
    // Actually create the entry in Strapi
    await strapi.documents(`api::${model}.${model}`).create({
      data: entry,
    });
  } catch (error) {
    console.error({ model, entry, error });
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Jika file tidak ada di disk, lewati (return null untuk single file)
    if (!fileExistsOnDisk(fileName)) {
      if (filesCopy.length === 1) {
        return null;
      }
      continue;
    }

    // Check if the file already exists in Strapi
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    });

    if (fileWhereName) {
      // File exists, don't upload it
      existingFiles.push(fileWhereName);
    } else {
      // File doesn't exist, upload it
      const fileData = getFileData(fileName);
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  if (allFiles.length === 0) return filesCopy.length === 1 ? null : [];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function importArticles(categoryIds, authorIds) {
  for (const article of articles) {
    const existing = await strapi.documents('api::article.article').findFirst({
      where: { slug: article.slug },
    });
    if (existing) continue;

    const cover = await checkFileExistsBeforeUpload([`${article.slug}.jpg`]);
    const updatedBlocks = await updateBlocks(article.blocks);
    const description =
      typeof article.description === 'string' && article.description.length > DESCRIPTION_MAX_LENGTH
        ? article.description.slice(0, DESCRIPTION_MAX_LENGTH)
        : article.description;

    await createEntry({
      model: 'article',
      entry: {
        ...article,
        description,
        category: { documentId: categoryIds[article.category.id - 1] },
        author: { documentId: authorIds[article.author.id - 1] },
        cover,
        blocks: updatedBlocks,
        publishedAt: Date.now(),
      },
    });
  }
}

async function importGlobal() {
  const existing = await strapi.documents('api::global.global').findFirst();
  if (existing) return;
  const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
  const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);
  return createEntry({
    model: 'global',
    entry: {
      ...global,
      favicon,
      publishedAt: Date.now(),
      defaultSeo: { ...global.defaultSeo, shareImage },
    },
  });
}

async function importAbout() {
  const existing = await strapi.documents('api::about.about').findFirst();
  if (existing) return;
  const updatedBlocks = await updateBlocks(about.blocks);
  await createEntry({
    model: 'about',
    entry: { ...about, blocks: updatedBlocks, publishedAt: Date.now() },
  });
}

const DESCRIPTION_MAX_LENGTH = 80;

/** Get or create category by slug; return array of category ids (urutan sama dengan data.categories). */
async function importCategories() {
  const ids = [];
  for (const category of categories) {
    let doc = await strapi.documents('api::category.category').findFirst({
      where: { slug: category.slug },
    });
    if (doc) {
      ids.push(doc.documentId ?? doc.id);
    } else {
      const created = await strapi.documents('api::category.category').create({
        data: category,
      });
      ids.push(created.documentId ?? created.id);
    }
  }
  return ids;
}

/** Get or create author; return array of author ids (urutan sama dengan data.authors). */
async function importAuthors() {
  const ids = [];
  for (const author of authors) {
    let doc = await strapi.documents('api::author.author').findFirst({
      where: { email: author.email },
    });
    if (doc) {
      ids.push(doc.documentId ?? doc.id);
    } else {
      const avatar = await checkFileExistsBeforeUpload([author.avatar]);
      const created = await strapi.documents('api::author.author').create({
        data: { ...author, avatar },
      });
      ids.push(created.documentId ?? created.id);
    }
  }
  return ids;
}

async function importSeedData() {
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    author: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
    homepage: ['find', 'findOne'],
    product: ['find', 'findOne'],
    client: ['find', 'findOne'],
    gallery: ['find', 'findOne'],
  });

  const categoryIds = await importCategories();
  const authorIds = await importAuthors();
  await importArticles(categoryIds, authorIds);
  await importGlobal();
  await importAbout();
  await importProducts();
  await importClients();
  await importGallery();
  await importHomepage();
}

async function importHomepage() {
  const existing = await strapi.documents('api::homepage.homepage').findFirst();
  if (existing) return;
  await createEntry({ model: 'homepage', entry: homepage });
}

async function importProducts() {
  const defaultImage = await checkFileExistsBeforeUpload(['default-image.png']);
  for (const product of products) {
    const existing = await strapi.documents('api::product.product').findFirst({
      where: { title: product.title },
    });
    if (existing) continue;
    await createEntry({
      model: 'product',
      entry: { ...product, image: defaultImage },
    });
  }
}

async function importClients() {
  const defaultLogo = await checkFileExistsBeforeUpload(['default-image.png']);
  for (const client of clients) {
    const existing = await strapi.documents('api::client.client').findFirst({
      where: { name: client.name },
    });
    if (existing) continue;
    await createEntry({
      model: 'client',
      entry: { ...client, logo: defaultLogo },
    });
  }
}

async function importGallery() {
  const images = await checkFileExistsBeforeUpload([
    'coffee-art.jpg',
    'coffee-beans.jpg',
    'coffee-shadow.jpg',
    'beautiful-picture.jpg',
    'we-love-pizza.jpg',
  ]);
  const imageList = Array.isArray(images) ? images : images ? [images] : [];
  for (let i = 0; i < gallery.length; i++) {
    const image = imageList[i] || imageList[0] || null;
    await createEntry({
      model: 'gallery',
      entry: {
        ...gallery[i],
        image,
      },
    });
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedExampleApp();
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
