module.exports = [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "market-assets.strapi.io",
            "https://*.myqcloud.com",
            "https://*.cos.*.myqcloud.com",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "market-assets.strapi.io",
            "https://*.myqcloud.com",
            "https://*.cos.*.myqcloud.com",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      formidable: {
        maxFileSize: 50 * 1024 * 1024, // 50 MB, sama dengan upload.sizeLimit
      },
    },
  },
  "strapi::session",
  'strapi::favicon',
  'strapi::public',
];
