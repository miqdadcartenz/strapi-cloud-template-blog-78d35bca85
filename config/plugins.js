module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-tencent-cloud-storage",
      providerOptions: {
        SecretId: env("COS_SECRET_ID"),
        SecretKey: env("COS_SECRET_KEY"),
        Region: env("COS_REGION"),
        Bucket: env("COS_BUCKET"),
        // Opsional: pakai CDN Tencent untuk akses file
        // CDNDomain: env("COS_CDN_DOMAIN"),
      },
    },
  },
});
