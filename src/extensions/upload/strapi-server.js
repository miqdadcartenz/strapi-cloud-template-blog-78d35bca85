'use strict';

const COS = require('cos-nodejs-sdk-v5');

const TENCENT_PROVIDER = 'strapi-provider-upload-tencent-cloud-storage';
const SIGNED_URL_EXPIRES = 3600; // 1 jam

/**
 * Generate COS object Key from Strapi file entity.
 * Mirrors getFileKey in strapi-provider-upload-tencent-cloud-storage (path or folderPath, hash, ext).
 */
function getFileKey(file) {
  const pathSegment = file.path
    ? `${file.path.replace(/\/+$/, '')}/`
    : file.folderPath && file.folderPath !== '/'
      ? `${file.folderPath.replace(/^\/+|\/+$/g, '')}/`
      : '';
  const storageRoot = (process.env.COS_STORAGE_ROOT_PATH || '').replace(/\/+$/, '');
  const prefix = storageRoot ? `${storageRoot}/` : '';
  return `${prefix}${pathSegment}${file.hash}${file.ext}`;
}

/**
 * Get signed URL for a private COS object.
 * Uses env: COS_SECRET_ID, COS_SECRET_KEY, COS_REGION, COS_BUCKET.
 */
function getSignedUrlForKey(Key) {
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;
  const Region = process.env.COS_REGION;
  const Bucket = process.env.COS_BUCKET;
  if (!SecretId || !SecretKey || !Region || !Bucket) {
    return null;
  }
  return new Promise((resolve) => {
    const cos = new COS({ SecretId, SecretKey });
    cos.getObjectUrl(
      {
        Bucket,
        Region,
        Key,
        Sign: true,
        Expires: SIGNED_URL_EXPIRES,
        Protocol: 'https',
      },
      (err, data) => {
        if (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[upload extension] getObjectUrl error:', err.message);
          }
          resolve(null);
          return;
        }
        resolve(data && data.Url ? data.Url : null);
      }
    );
  });
}

/**
 * Replace url with signed URL for Tencent COS files in the response body.
 */
async function ensureSignedUrls(body) {
  if (!body) return body;
  const items = Array.isArray(body) ? body : [body];
  for (const file of items) {
    if (
      file &&
      file.provider === TENCENT_PROVIDER &&
      (file.url || file.hash)
    ) {
      const Key = getFileKey(file);
      const signedUrl = await getSignedUrlForKey(Key);
      if (signedUrl) {
        file.url = signedUrl;
        file.previewUrl = signedUrl;
        file.isUrlSigned = true;
      }
    }
  }
  return body;
}

module.exports = (plugin) => {
  const originalContentApi = plugin.controllers['content-api'];
  if (typeof originalContentApi !== 'function') return plugin;

  plugin.controllers['content-api'] = (opts) => {
    const contentApi = originalContentApi(opts);
    if (!contentApi) return contentApi;

    const originalFind = contentApi.find?.bind(contentApi);
    const originalFindOne = contentApi.findOne?.bind(contentApi);
    if (originalFind) {
      contentApi.find = async (ctx) => {
        await originalFind(ctx);
        ctx.body = await ensureSignedUrls(ctx.body);
      };
    }
    if (originalFindOne) {
      contentApi.findOne = async (ctx) => {
        await originalFindOne(ctx);
        ctx.body = await ensureSignedUrls(ctx.body);
      };
    }
    return contentApi;
  };

  return plugin;
};
