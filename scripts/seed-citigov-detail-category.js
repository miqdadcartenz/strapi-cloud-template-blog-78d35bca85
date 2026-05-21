'use strict';

/** Wrapper agar `npm run seed:citigov-detail-category` tetap jalan tanpa argumen. */
process.argv[2] = 'api::citigov-detail-category.citigov-detail-category';
process.argv[3] = 'citigov-detail-category.json';

require('./seed-detail-category.js');
