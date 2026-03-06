'use strict';

const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const os = require('os');
const path = require('path');
const fse = require('fs-extra');

const TENCENT_PROVIDER = 'strapi-provider-upload-tencent-cloud-storage';
const SIGNED_URL_EXPIRES = 3600; // 1 jam

let safeRemovePatched = false;
let safeFsUnlinkPatched = false;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isWindowsTmpPath(p) {
  if (!p) return false;
  const resolved = path.resolve(String(p));
  const tmpRoot = path.resolve(os.tmpdir());
  return resolved.startsWith(tmpRoot);
}

function isStrapiUploadOptimizedTmpPath(p) {
  if (!p) return false;
  const resolved = path.resolve(String(p));
  return (
    isWindowsTmpPath(resolved) &&
    resolved.includes(`${path.sep}strapi-upload-`) &&
    resolved.includes(`${path.sep}optimized-`)
  );
}

/**
 * Global fs patch for Windows: retry/ignore EBUSY on tmp optimized files.
 * This catches cleanup errors even when they originate inside fs-extra internals.
 */
function patchFsUnlinkForWindowsTemp() {
  if (safeFsUnlinkPatched) return;
  safeFsUnlinkPatched = true;

  if (process.platform !== 'win32') return;

  /** @type {any} */
  const fsAny = fs;

  const retryable = new Set(['EBUSY', 'EPERM', 'ENOTEMPTY']);
  const maxAttempts = 6;
  const delays = [50, 100, 200, 400, 800, 1200];

  const originalUnlink = fs.unlink.bind(fs);
  fsAny.unlink = (p, cb) => {
    // IMPORTANT: on Windows, the upload stack (formidable/koa-body/sharp) may use random temp
    // file names directly under os.tmpdir(), not only strapi-upload/optimized-*.
    if (!isWindowsTmpPath(p)) return originalUnlink(p, cb);
    let attempt = 0;
    const tryOnce = () => {
      originalUnlink(p, async (err) => {
        if (!err) return cb?.(null);
        if (err.code === 'ENOENT') return cb?.(null);
        if (!retryable.has(err.code) || attempt >= maxAttempts) return cb?.(null);
        const delay = delays[Math.min(attempt, delays.length - 1)];
        attempt += 1;
        await sleep(delay);
        tryOnce();
      });
    };
    tryOnce();
  };

  if (fs.promises?.unlink) {
    const originalPromisesUnlink = fs.promises.unlink.bind(fs.promises);
    fs.promises.unlink = async (p) => {
      if (!isWindowsTmpPath(p)) return originalPromisesUnlink(p);
      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          // eslint-disable-next-line no-await-in-loop
          return await originalPromisesUnlink(p);
        } catch (err) {
          if (err?.code === 'ENOENT') return;
          if (!retryable.has(err?.code) || attempt >= maxAttempts) return;
          const delay = delays[Math.min(attempt, delays.length - 1)];
          attempt += 1;
          // eslint-disable-next-line no-await-in-loop
          await sleep(delay);
        }
      }
    };
  }
}

/**
 * Windows sometimes keeps a lock on recently-used temp files (Sharp streams),
 * causing cleanup to fail with EBUSY/EPERM. This patch makes cleanup resilient
 * for Strapi upload temp directories only.
 */
function patchFsExtraRemoveForWindowsTemp() {
  if (safeRemovePatched) return;
  safeRemovePatched = true;

  if (process.platform !== 'win32') return;

  const tmpRoot = path.resolve(os.tmpdir());

  const retryable = new Set(['EBUSY', 'EPERM', 'ENOTEMPTY']);
  const maxAttempts = 6;
  // exponential-ish backoff: 50, 100, 200, 400, 800, 1200
  const delays = [50, 100, 200, 400, 800, 1200];

  const patchRemove = (fseInstance) => {
    if (!fseInstance || typeof fseInstance.remove !== 'function') return;

    const originalRemove = fseInstance.remove.bind(fseInstance);

    fseInstance.remove = async (targetPath, ...rest) => {
      const resolved = targetPath ? path.resolve(String(targetPath)) : '';
      const isStrapiTmp =
        resolved.startsWith(tmpRoot) && resolved.includes(`${path.sep}strapi-upload-`);

      // Default behavior for non Strapi temp paths
      if (!isStrapiTmp) {
        return originalRemove(targetPath, ...rest);
      }

      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          // eslint-disable-next-line no-await-in-loop
          return await originalRemove(targetPath, ...rest);
        } catch (err) {
          const code = err && err.code;
          if (code === 'ENOENT') return; // already deleted
          if (!retryable.has(code)) throw err;
          // eslint-disable-next-line no-await-in-loop
          await sleep(delays[Math.min(attempt, delays.length - 1)]);
          attempt += 1;
        }
      }

      // Give up silently to avoid breaking the upload flow.
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[upload extension] temp cleanup skipped (file lock):', resolved);
      }
    };
  };

  // Patch the fs-extra instance used by this extension (may differ from Strapi plugin's instance)
  patchRemove(fse);

  // Patch the fs-extra instance resolved from @strapi/upload context (most important)
  try {
    const uploadPkgRoot = path.dirname(require.resolve('@strapi/upload/package.json'));
    const uploadServicesDir = path.join(uploadPkgRoot, 'dist', 'server', 'services');
    const uploadDir = uploadServicesDir;
    const fsePath = require.resolve('fs-extra', { paths: [uploadDir] });
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const uploadFse = require(fsePath);
    patchRemove(uploadFse);
  } catch {
    // ignore - best effort
  }
}

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
  patchFsExtraRemoveForWindowsTemp();
  patchFsUnlinkForWindowsTemp();

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
