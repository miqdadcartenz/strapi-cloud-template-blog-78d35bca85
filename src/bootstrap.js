'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { categories, authors, articles, global, about, homepage, products, clients, gallery } = require('../data/data.json');
const productPages = require('../data/product-pages.json');

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun();

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
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

const dataUploadsPath = path.join(__dirname, '..', 'data', 'uploads');

function getFileData(fileName) {
  const filePath = path.join(dataUploadsPath, fileName);
  try {
    if (!fs.existsSync(filePath)) return null;
    const size = getFileSizeInBytes(filePath);
    const ext = fileName.split('.').pop();
    const mimeType = mime.lookup(ext || '') || '';
    return {
      filepath: filePath,
      originalFileName: fileName,
      size,
      mimetype: mimeType,
    };
  } catch {
    return null;
  }
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

function fileExistsOnDisk(fileName) {
  return fs.existsSync(path.join(dataUploadsPath, fileName));
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    if (!fileExistsOnDisk(fileName)) {
      if (filesCopy.length === 1) return null;
      continue;
    }
    const fileWhereName = await strapi.query('plugin::upload.file').findOne({
      where: {
        name: fileName.replace(/\..*$/, ''),
      },
    });

    if (fileWhereName) {
      existingFiles.push(fileWhereName);
    } else {
      const fileData = getFileData(fileName);
      if (!fileData) {
        if (filesCopy.length === 1) return null;
        continue;
      }
      const fileNameNoExtension = fileName.split('.').shift();
      const [file] = await uploadFile(fileData, fileNameNoExtension);
      uploadedFiles.push(file);
    }
  }
  const allFiles = [...existingFiles, ...uploadedFiles];
  if (allFiles.length === 0) return filesCopy.length === 1 ? null : [];
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

const DESCRIPTION_MAX_LENGTH = 80;

async function importArticles(categoryIds, authorIds) {
  for (const article of articles) {
    const cover = await checkFileExistsBeforeUpload([`${article.slug}.jpg`]);
    const updatedBlocks = await updateBlocks(article.blocks || []);
    const description =
      typeof article.description === 'string' && article.description.length > DESCRIPTION_MAX_LENGTH
        ? article.description.slice(0, DESCRIPTION_MAX_LENGTH)
        : article.description;

    await createEntry({
      model: 'article',
      entry: {
        ...article,
        description,
        category: categoryIds && article.category ? { documentId: categoryIds[article.category.id - 1] } : undefined,
        author: authorIds && article.author ? { documentId: authorIds[article.author.id - 1] } : undefined,
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
      defaultSeo: {
        ...global.defaultSeo,
        shareImage,
      },
    },
  });
}

async function importAbout() {
  const existing = await strapi.documents('api::about.about').findFirst();
  if (existing) return;
  const updatedBlocks = await updateBlocks(about.blocks || []);
  await createEntry({
    model: 'about',
    entry: {
      ...about,
      blocks: updatedBlocks,
      publishedAt: Date.now(),
    },
  });
}

/** Return array of documentIds (urutan sama dengan data.categories). */
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

/** Return array of documentIds (urutan sama dengan data.authors). */
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
  // Allow read of application content types
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
    'product-page': ['find', 'findOne'],
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
  await importProductPages();
}

async function importHomepage() {
  const existing = await strapi.documents('api::homepage.homepage').findFirst();
  if (existing) return;
  await createEntry({
    model: 'homepage',
    entry: homepage,
  });
}

async function importProductPages() {
  for (const page of productPages) {
    const existing = await strapi.documents('api::product-page.product-page').findFirst({
      where: { slug: page.slug },
    });
    if (existing) continue;
    await createEntry({
      model: 'product-page',
      entry: page,
    });
  }
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
      entry: {
        ...product,
        image: defaultImage,
      },
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
      entry: {
        ...client,
        logo: defaultLogo,
      },
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


module.exports = async () => {
  await seedExampleApp();
};
