const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const nodeEnv = process.env.NODE_ENV || 'development'

const FORBIDDEN_SECRETS = [
  // Placeholders shipped in .env.example (long enough to boot a dev copy, never valid in production)
  'dev_only_change_me_access_token_secret_0000000000',
  'dev_only_change_me_refresh_token_secret_000000000',
  'sms_jwt_super_secret_access_key_2026_x89a',
  'your_access_token_secret_here',
  'sms_jwt_refresh_super_secret_key_2026_z12b',
  'your_refresh_token_secret_here',
]

if (nodeEnv !== 'test') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('[Security Config Error]: JWT_SECRET must be set in environment and be at least 32 characters long.')
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('[Security Config Error]: JWT_REFRESH_SECRET must be set in environment and be at least 32 characters long.')
  }
  if (nodeEnv === 'production') {
    if (FORBIDDEN_SECRETS.includes(process.env.JWT_SECRET)) {
      throw new Error('[Security Config Error]: Default/placeholder JWT_SECRET is strictly forbidden in production.')
    }
    if (FORBIDDEN_SECRETS.includes(process.env.JWT_REFRESH_SECRET)) {
      throw new Error('[Security Config Error]: Default/placeholder JWT_REFRESH_SECRET is strictly forbidden in production.')
    }
  }
}

const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/sms_dev',
  JWT_SECRET: process.env.JWT_SECRET || (nodeEnv === 'test' ? 'test_jwt_secret_min_32_chars_long_placeholder_1234' : undefined),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (nodeEnv === 'test' ? 'test_jwt_refresh_secret_min_32_chars_placeholder_5678' : undefined),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: nodeEnv,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  // Optional antivirus scanning of uploads with a ClamAV daemon. Empty CLAMAV_HOST = disabled.
  // When set, every uploaded file is scanned before it is kept; an infected file is rejected and,
  // if the scanner cannot be reached, the upload is refused (it fails closed).
  CLAMAV_HOST: (process.env.CLAMAV_HOST || '').trim(),
  CLAMAV_PORT: parseInt(process.env.CLAMAV_PORT || '3310', 10),
  CLAMAV_TIMEOUT_MS: parseInt(process.env.CLAMAV_TIMEOUT_MS || '30000', 10),
  // How many reverse proxies sit in front of the API and set X-Forwarded-For. The bundled nginx is
  // one hop. Put a CDN or load balancer in front of it and raise this (e.g. 2); run the API directly
  // exposed (no proxy) and set 0. A wrong value makes every client share one rate-limit bucket (too
  // few hops) or lets a client spoof its address (too many).
  TRUST_PROXY_HOPS: (() => {
    const hops = parseInt(process.env.TRUST_PROXY_HOPS ?? '1', 10)
    return Number.isInteger(hops) && hops >= 0 && hops <= 10 ? hops : 1
  })(),
  // The school's own calendar day (weekday rules, "today" views) regardless of the server clock (LOW-04)
  SCHOOL_TIMEZONE: process.env.SCHOOL_TIMEZONE || 'Asia/Karachi',
}

module.exports = env
