// Run with the backend as the working directory: `node ../frontend/e2e/prepare-db.cjs drop|patch`.
//   drop  - empties the throwaway end-to-end database (refuses any other database name)
//   patch - lifts the "must change password" flag on the seeded demo accounts and adds one guardian,
//           so tests can sign in directly
const path = require('path')
const mongoose = require(path.join(process.cwd(), 'node_modules', 'mongoose'))

const [mode] = process.argv.slice(2)
const uri = process.env.MONGODB_URI
const SAFE_NAME = 'sms_e2e'

;(async () => {
  await mongoose.connect(uri)
  if (mongoose.connection.name !== SAFE_NAME) throw new Error(`refusing to touch database "${mongoose.connection.name}"`)
  const db = mongoose.connection.db

  if (mode === 'drop') {
    await db.dropDatabase()
  } else if (mode === 'patch') {
    await db.collection('users').updateMany({}, { $set: { mustChangePassword: false } })
    const admin = await db.collection('users').findOne({ username: 'admin' })
    const role = await db.collection('roles').findOne({ name: 'guardian' })
    const students = await db.collection('students').find({}).sort({ studentId: 1 }).limit(2).toArray()
    await db.collection('users').insertOne({
      username: 'e2e_guardian',
      passwordHash: admin.passwordHash, // same demo password as the seeded admin
      role: role._id,
      roleName: 'guardian',
      studentId: students[0]._id,
      studentIds: students.map((s) => s._id),
      isActive: true,
      mustChangePassword: false,
      tokenVersion: 0,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    throw new Error('usage: prepare-db.cjs drop|patch')
  }
  await mongoose.disconnect()
})().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
