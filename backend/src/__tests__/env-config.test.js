// config/env.js decides whether the server may start at all (secrets) and parses the deployment knobs.
// It reads process.env when first required, so each case loads a fresh copy with its own environment.
jest.mock('dotenv', () => ({ config: jest.fn() })) // never read the developer's real backend/.env

const GOOD_ACCESS = 'a'.repeat(40)
const GOOD_REFRESH = 'b'.repeat(40)
const PLACEHOLDER = 'dev_only_change_me_access_token_secret_0000000000'

const loadEnv = (vars) => {
  const saved = { ...process.env }
  for (const key of Object.keys(process.env)) {
    if (/^(NODE_ENV|JWT_|MONGODB_|PORT|CORS_|UPLOAD_|MAX_FILE|REDIS_|CLAMAV_|TRUST_PROXY|SCHOOL_)/.test(key)) delete process.env[key]
  }
  Object.assign(process.env, vars)
  try {
    let loaded
    jest.isolateModules(() => { loaded = require('../config/env') })
    return loaded
  } finally {
    process.env = saved
  }
}
const prod = (extra = {}) => ({ NODE_ENV: 'production', JWT_SECRET: GOOD_ACCESS, JWT_REFRESH_SECRET: GOOD_REFRESH, ...extra })

describe('secrets are enforced outside tests', () => {
  test('a missing or short JWT_SECRET stops the server from starting', () => {
    expect(() => loadEnv({ NODE_ENV: 'development', JWT_REFRESH_SECRET: GOOD_REFRESH })).toThrow(/JWT_SECRET must be set/)
    expect(() => loadEnv({ NODE_ENV: 'development', JWT_SECRET: 'short', JWT_REFRESH_SECRET: GOOD_REFRESH })).toThrow(/at least 32/)
  })

  test('a missing or short JWT_REFRESH_SECRET stops it too', () => {
    expect(() => loadEnv({ NODE_ENV: 'development', JWT_SECRET: GOOD_ACCESS })).toThrow(/JWT_REFRESH_SECRET must be set/)
    expect(() => loadEnv({ NODE_ENV: 'development', JWT_SECRET: GOOD_ACCESS, JWT_REFRESH_SECRET: 'short' })).toThrow(/JWT_REFRESH_SECRET/)
  })

  test('production refuses the placeholder secrets that ship in .env.example', () => {
    expect(() => loadEnv(prod({ JWT_SECRET: PLACEHOLDER }))).toThrow(/placeholder JWT_SECRET is strictly forbidden/)
    expect(() => loadEnv(prod({ JWT_REFRESH_SECRET: 'dev_only_change_me_refresh_token_secret_000000000' }))).toThrow(/placeholder JWT_REFRESH_SECRET/)
  })

  test('development tolerates a placeholder (it is the documented local default)', () => {
    expect(loadEnv({ NODE_ENV: 'development', JWT_SECRET: PLACEHOLDER, JWT_REFRESH_SECRET: GOOD_REFRESH }).JWT_SECRET).toBe(PLACEHOLDER)
  })

  test('the test environment supplies its own throwaway secrets', () => {
    const env = loadEnv({ NODE_ENV: 'test' })
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32)
    expect(env.JWT_REFRESH_SECRET.length).toBeGreaterThanOrEqual(32)
  })

  test('real secrets are passed through untouched', () => {
    const env = loadEnv(prod())
    expect(env.JWT_SECRET).toBe(GOOD_ACCESS)
    expect(env.JWT_REFRESH_SECRET).toBe(GOOD_REFRESH)
  })
})

describe('defaults and parsing', () => {
  test('sensible defaults when nothing is set', () => {
    const env = loadEnv(prod())
    expect(env).toMatchObject({
      MONGODB_URI: 'mongodb://localhost:27017/sms_dev',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      PORT: 5000,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'http://localhost:3000',
      UPLOAD_DIR: './uploads',
      MAX_FILE_SIZE_MB: 10,
      REDIS_URL: 'redis://127.0.0.1:6379',
      CLAMAV_HOST: '',
      CLAMAV_PORT: 3310,
      CLAMAV_TIMEOUT_MS: 30000,
      TRUST_PROXY_HOPS: 1,
      SCHOOL_TIMEZONE: 'Asia/Karachi',
    })
  })

  test('numbers are parsed from strings and strings are taken as given', () => {
    const env = loadEnv(prod({ PORT: '8080', MAX_FILE_SIZE_MB: '25', CORS_ORIGIN: 'https://sms.example.org', SCHOOL_TIMEZONE: 'Asia/Dubai', REDIS_URL: 'redis://cache:6379' }))
    expect(env.PORT).toBe(8080)
    expect(env.MAX_FILE_SIZE_MB).toBe(25)
    expect(env.CORS_ORIGIN).toBe('https://sms.example.org')
    expect(env.SCHOOL_TIMEZONE).toBe('Asia/Dubai')
    expect(env.REDIS_URL).toBe('redis://cache:6379')
  })

  test('the antivirus host is trimmed, and blank means disabled', () => {
    expect(loadEnv(prod({ CLAMAV_HOST: '  clamav  ', CLAMAV_PORT: '3311', CLAMAV_TIMEOUT_MS: '5000' }))).toMatchObject({ CLAMAV_HOST: 'clamav', CLAMAV_PORT: 3311, CLAMAV_TIMEOUT_MS: 5000 })
    expect(loadEnv(prod({ CLAMAV_HOST: '   ' })).CLAMAV_HOST).toBe('')
  })

  test.each([
    ['0', 0], ['1', 1], ['2', 2], ['10', 10],
    ['11', 1], ['-1', 1], ['abc', 1], ['1.5', 1], ['', 1],
  ])('TRUST_PROXY_HOPS=%j means %i hop(s)', (value, expected) => {
    expect(loadEnv(prod({ TRUST_PROXY_HOPS: value })).TRUST_PROXY_HOPS).toBe(expected)
  })

  test('an unset TRUST_PROXY_HOPS is one hop (the bundled nginx)', () => {
    expect(loadEnv(prod()).TRUST_PROXY_HOPS).toBe(1)
  })
})
