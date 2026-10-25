const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '../../.env') })

const nodeEnv = process.env.NODE_ENV || 'development'

const FORBIDDEN_SECRETS = [
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
}

module.exports = env
