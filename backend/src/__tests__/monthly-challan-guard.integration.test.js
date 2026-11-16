// The double-billing guard, against a real MongoDB (see test/integration-db.js): the partial unique
// index on StudentFee(studentId, monthlyKey) refuses a second monthly challan for the same student and
// fee structure, even when two writers race past the "already billed?" lookup.
const mongoose = require('mongoose')
const { setupIntegrationDb } = require('../../test/integration-db')

jest.setTimeout(90000)

let ctx
let accountant
let StudentFee
let insertChallansIdempotently

beforeAll(async () => {
  ctx = await setupIntegrationDb('challanguard')
  accountant = await ctx.as('accountant1')
  StudentFee = require('../models/StudentFee.model')
  ;({ insertChallansIdempotently } = require('../services/monthly-challan.service'))
  await StudentFee.init() // make sure the indexes exist before the tests rely on them
})
afterAll(async () => { if (ctx) await ctx.teardown() })

const expectStatus = (res, status = 200) => {
  if (res.status !== status) throw new Error(`Expected ${status}, got ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`)
  return res.body
}
const oid = () => new mongoose.Types.ObjectId()
const challan = (studentId, structureId, { stamped = true } = {}) => ({
  studentId,
  feeStructureId: structureId,
  amountDue: 1000,
  netAmount: 1000,
  outstandingAmount: 1000,
  dueDate: new Date('2027-03-10'),
  ...(stamped ? { monthlyKey: String(structureId) } : {}),
})

describe('the unique index', () => {
  test('exists, is unique and only covers challans that carry a monthlyKey', async () => {
    const indexes = await StudentFee.collection.indexes()
    const guard = indexes.find((i) => i.name === 'studentId_1_monthlyKey_1')

    expect(guard).toBeDefined()
    expect(guard.unique).toBe(true)
    expect(guard.partialFilterExpression).toEqual({ monthlyKey: { $type: 'string' } })
    // the older plain index is still there
    expect(indexes.some((i) => i.name === 'studentId_1_feeStructureId_1' && !i.unique)).toBe(true)
  })

  test('refuses a second stamped challan for the same student and structure', async () => {
    const student = oid()
    const structure = oid()
    await StudentFee.create(challan(student, structure))

    await expect(StudentFee.create(challan(student, structure))).rejects.toMatchObject({ code: 11000 })
    expect(await StudentFee.countDocuments({ studentId: student, feeStructureId: structure })).toBe(1)
  })

  test('allows the same student in another structure, and another student in the same structure', async () => {
    const student = oid()
    const structureA = oid()
    const structureB = oid()
    await StudentFee.create(challan(student, structureA))
    await StudentFee.create(challan(student, structureB))
    await StudentFee.create(challan(oid(), structureA))

    expect(await StudentFee.countDocuments({ feeStructureId: structureA })).toBeGreaterThanOrEqual(2)
  })

  test('does not apply to challans without a monthlyKey (manual fees, forced regeneration)', async () => {
    const student = oid()
    const structure = oid()
    await StudentFee.create(challan(student, structure, { stamped: false }))
    await StudentFee.create(challan(student, structure, { stamped: false }))

    expect(await StudentFee.countDocuments({ studentId: student, feeStructureId: structure })).toBe(2)
  })
})

describe('insertChallansIdempotently on real data', () => {
  test('writes the new rows and counts the ones that already existed', async () => {
    const structure = oid()
    const [s1, s2, s3] = [oid(), oid(), oid()]
    await StudentFee.create(challan(s1, structure)) // billed earlier by someone else

    const result = await insertChallansIdempotently([s1, s2, s3].map((s) => challan(s, structure)))

    expect(result.inserted).toHaveLength(2)
    expect(result.duplicates).toBe(1)
    expect(await StudentFee.countDocuments({ feeStructureId: structure })).toBe(3)
  })

  test('two writers racing for the same students bill each student exactly once', async () => {
    const structure = oid()
    const students = Array.from({ length: 60 }, () => oid())
    const items = () => students.map((s) => challan(s, structure))

    // Both writers have already decided "nobody is billed yet" and insert at the same moment
    const [a, b] = await Promise.all([insertChallansIdempotently(items()), insertChallansIdempotently(items())])

    expect(await StudentFee.countDocuments({ feeStructureId: structure })).toBe(60)
    expect(a.inserted.length + b.inserted.length).toBe(60)
    expect(a.duplicates + b.duplicates).toBe(60)
  })

  test('an invalid row is reported, not silently dropped (the valid rows are still written)', async () => {
    const structure = oid()
    const good = oid()

    await expect(insertChallansIdempotently([
      challan(good, structure),
      { studentId: oid() }, // missing feeStructureId, amounts and due date
    ])).rejects.toThrow()

    expect(await StudentFee.countDocuments({ studentId: good, feeStructureId: structure })).toBe(1)
  })
})

describe('the monthly generation through the API', () => {
  const TARGET = '2027-02-01'
  const stampedCount = () => StudentFee.countDocuments({ monthlyKey: { $type: 'string' } })

  test('stamps every challan it creates, and a second run bills nobody twice', async () => {
    const before = await stampedCount()
    const first = expectStatus(await accountant.post('/api/v1/finance/monthly-challans/generate').send({ targetDate: TARGET }))

    expect(first.data.generatedCount).toBeGreaterThan(0)
    expect(await stampedCount()).toBe(before + first.data.generatedCount)

    const second = expectStatus(await accountant.post('/api/v1/finance/monthly-challans/generate').send({ targetDate: TARGET }))
    expect(second.data.generatedCount).toBe(0)
    expect(await stampedCount()).toBe(before + first.data.generatedCount)
  })

  test('a deliberate force regeneration still works and its duplicates are allowed', async () => {
    const stampedBefore = await stampedCount()
    const forced = expectStatus(await accountant.post('/api/v1/finance/monthly-challans/generate').send({ targetDate: TARGET, force: true }))

    expect(forced.data.generatedCount).toBeGreaterThan(0)
    expect(await stampedCount()).toBe(stampedBefore) // forced rows carry no monthlyKey
  })
})
