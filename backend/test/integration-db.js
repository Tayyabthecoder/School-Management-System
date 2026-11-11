/**
 * Real-MongoDB harness for the *.integration.test.js suites.
 *
 * Each test file gets its own throwaway database on TEST_MONGODB_URI (default: the local
 * server), filled with the same demo dataset as `npm run db:seed`, plus the few things the
 * seed doesn't create (a two-child guardian, timetable periods, all-week access).
 * The database is dropped when the file finishes. CI provides MongoDB as a service.
 */
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const request = require('supertest')

const BASE_URI = (process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017').replace(/\/+$/, '')
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const setupIntegrationDb = async (label) => {
  const dbName = `sms_jest_${label}_${process.pid}_${Date.now()}`
  await mongoose.connect(`${BASE_URI}/${dbName}`, { serverSelectionTimeoutMS: 5000 })

  const { populateDatabase } = require('../seed/seed')
  await populateDatabase({ log: () => {} })

  const env = require('../src/config/env')
  const User = require('../src/models/User.model')
  const Role = require('../src/models/Role.model')
  const Student = require('../src/models/Student.model')
  const Staff = require('../src/models/Staff.model')
  const Class = require('../src/models/Class.model')
  const Subject = require('../src/models/Subject.model')
  const TimetableEntry = require('../src/models/TimetableEntry.model')
  const SchoolSettings = require('../src/models/SchoolSettings.model')
  const { invalidateCache } = require('../src/utils/cache.util')
  await require('../src/config/roles').syncDefaultRoles(Role)

  // Tests may run on any weekday, and non-admin roles are day-restricted
  await SchoolSettings.deleteMany({})
  await SchoolSettings.create({ isActive: true, allowedDays: ALL_DAYS })
  await invalidateCache('ref:school-settings')

  const students = await Student.find({ deletedAt: null }).sort({ studentId: 1 }).populate('classId').lean()
  const [childA, childB] = students
  const guardianRole = await Role.findOne({ name: 'guardian' })
  const guardian = await User.create({
    username: 'it_guardian',
    passwordHash: 'not-used-tokens-are-minted',
    role: guardianRole._id,
    roleName: 'guardian',
    studentId: childA._id,
    studentIds: [childA._id, childB._id],
    mustChangePassword: false,
  })

  // The seed has no timetable: give teacher1 a period every day for the first class
  const teacherUser = await User.findOne({ username: 'teacher1' })
  const teacherStaff = await Staff.findById(teacherUser.staffId)
  const cls = await Class.findById(childA.classId._id)
  const subject = await Subject.findOne({ classId: cls._id })
  await TimetableEntry.insertMany(ALL_DAYS.map((dayOfWeek, i) => ({
    classId: cls._id,
    sectionId: childA.sectionId,
    subjectId: subject._id,
    teacherId: teacherStaff._id,
    dayOfWeek,
    periodNumber: 1 + (i % 2),
    startTime: '08:00',
    endTime: '08:45',
    room: 'R-1',
  })))

  await User.updateMany({}, { $set: { mustChangePassword: false } })

  const tokenCache = {}
  const token = async (username) => {
    if (tokenCache[username]) return tokenCache[username]
    const user = await User.findOne({ username })
    if (!user) throw new Error(`No fixture user ${username}`)
    tokenCache[username] = jwt.sign({ id: user._id, role: user.roleName, tokenVersion: user.tokenVersion || 0 }, env.JWT_SECRET, { expiresIn: '15m' })
    return tokenCache[username]
  }

  const app = require('../src/app')
  // Rate limits are per client IP (the app trusts one proxy hop). Each request gets its own
  // X-Forwarded-For address so a suite's many export calls behave like separate clients.
  let clientCounter = 0
  const nextClientIp = () => {
    clientCounter += 1
    return `10.${(clientCounter >> 16) & 255}.${(clientCounter >> 8) & 255}.${clientCounter & 255}`
  }
  /** request(app) with a Bearer token for the given fixture user */
  const as = async (username) => {
    const auth = `Bearer ${await token(username)}`
    const agent = request(app)
    const wrap = (method) => (url) => agent[method](url).set('Authorization', auth).set('X-Forwarded-For', nextClientIp())
    return { get: wrap('get'), post: wrap('post'), put: wrap('put'), patch: wrap('patch'), delete: wrap('delete') }
  }

  return {
    app,
    as,
    token,
    fixtures: { students, childA, childB, guardian, teacherStaff, cls, subject },
    teardown: async () => {
      await mongoose.connection.dropDatabase()
      await mongoose.disconnect()
    },
  }
}

module.exports = { setupIntegrationDb, ALL_DAYS }
