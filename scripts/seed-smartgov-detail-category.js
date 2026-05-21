'use strict';

/** Wrapper agar `npm run seed:smartgov-detail-category` tetap jalan tanpa argumen. */
process.argv.push(
  'api::smartgov-detail-category.smartgov-detail-category',
  'smartgov-detail-category.json'
);
require('./seed-detail-category.js');
