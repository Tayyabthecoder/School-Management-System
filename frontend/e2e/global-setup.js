import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const backend = path.resolve(here, '../../backend')
const MONGO = process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017'

// Fresh, seeded database for every run: drop, run the project's own seed, then lift the forced
// password change on the demo accounts.
export default async function globalSetup() {
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    MONGODB_URI: `${MONGO}/sms_e2e`,
    MONGODB_DB_NAME: 'sms_e2e',
    JWT_SECRET: 'e2e_access_secret_0123456789_0123456789_abcdef',
    JWT_REFRESH_SECRET: 'e2e_refresh_secret_0123456789_0123456789_abcde',
  }
  const run = (args) => execFileSync(process.execPath, args, { cwd: backend, env, stdio: 'pipe', timeout: 120_000 })

  run([path.join(here, 'prepare-db.cjs'), 'drop'])
  run(['seed/seed.js'])
  run([path.join(here, 'prepare-db.cjs'), 'patch'])
}
