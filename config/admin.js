module.exports = ({ env }) => ({
  secrets: {
    encryptionKey: env('ADMIN_ENCRYPTION_KEY', 'template-dev-encryption-key-32chars!!'),
  },
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      // Nilai dalam detik (30 hari). Jangan pakai string '30d' — menyebabkan "Invalid time value".
      maxSessionLifespan: env.int('ADMIN_SESSION_LIFESPAN', 30 * 24 * 60 * 60),
      maxRefreshTokenLifespan: env.int('ADMIN_REFRESH_TOKEN_LIFESPAN', 30 * 24 * 60 * 60),
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
