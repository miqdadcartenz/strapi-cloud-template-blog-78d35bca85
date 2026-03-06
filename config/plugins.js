module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-provider-upload-tencent-cloud-storage",
      providerOptions: {
        SecretId: env("COS_SECRET_ID"),
        SecretKey: env("COS_SECRET_KEY"),
        Region: env("COS_REGION"),
        Bucket: env("COS_BUCKET"),
        ACL: "private",
        Expires: 3600,
        // Opsional: pakai CDN Tencent untuk akses file
        // CDNDomain: env("COS_CDN_DOMAIN"),
      },
      sizeLimit: 50 * 1024 * 1024, // 50 MB
      security: {
        allowedTypes: [
          "image/*",
          "video/*",
          "audio/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        deniedTypes: [
          "application/x-sh",
          "application/x-dosexec",
          "application/javascript",
          "application/x-executable",
        ],
      },
    },
  },
});
