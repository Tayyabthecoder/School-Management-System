// Core middleware (validation, error mapping) and the timetable controller.
const { z } = require('zod')
const { validate } = require('../middleware/validate.middleware')
const { ApiError, errorHandler } = require('../middleware/error.middleware')
const TimetableEntry = require('../models/TimetableEntry.model')
const timetable = require('../modules/timetable/timetable.controller')
const { assertTeacherAvailable } = require('../modules/timetable/timetable.service')

jest.mock('../models/TimetableEntry.model')
jest.mock('../modules/timetable/timetable.service', () => ({
  assertTeacherAvailable: jest.fn().mockResolvedValue(),
  TEACHER_PUBLIC_FIELDS: 'fullName',
}))

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

describe('validate middleware', () => {
  const schema = z.object({
    body: z.object({ name: z.string().min(2), age: z.number().optional() }),
  })

  test('replaces req.body with the parsed copy, stripping unknown keys', () => {
    const req = { body: { name: 'Ali', isAdmin: true }, query: {}, params: {} }
    const next = jest.fn()

    validate(schema)(req, {}, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ name: 'Ali' })
  })

  test('reports each invalid field with a 400', () => {
    const req = { body: { name: 'A' }, query: {}, params: {} }
    const next = jest.fn()

    validate(schema)(req, {}, next)

    const err = next.mock.calls[0][0]
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(400)
    expect(err.details).toEqual([expect.objectContaining({ field: 'name' })])
  })
})

describe('errorHandler', () => {
  const run = (err, env = 'test') => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = env
    const res = mockRes()
    try {
      errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, jest.fn())
    } finally {
      process.env.NODE_ENV = previous
    }
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] }
  }

  test('keeps the status and message of an ApiError', () => {
    const { status, body } = run(new ApiError(403, 'Nope'))
    expect(status).toBe(403)
    expect(body).toMatchObject({ success: false, error: { message: 'Nope' } })
  })

  test('maps Mongoose validation errors to 400 with field details', () => {
    const err = Object.assign(new Error('bad'), {
      name: 'ValidationError',
      errors: { dob: { path: 'dob', message: 'Required' } },
    })
    const { status, body } = run(err)
    expect(status).toBe(400)
    expect(body.error.details).toEqual([{ field: 'dob', message: 'Required' }])
  })

  test('maps a malformed ObjectId (CastError) to 400', () => {
    const { status, body } = run(Object.assign(new Error('cast'), { name: 'CastError', path: '_id' }))
    expect(status).toBe(400)
    expect(body.error.message).toBe('Invalid _id format')
  })

  test('maps a duplicate key to 409 naming the field', () => {
    const { status, body } = run(Object.assign(new Error('dup'), { code: 11000, keyValue: { studentId: 'X' } }))
    expect(status).toBe(409)
    expect(body.error.message).toBe('Duplicate entry for field: studentId')
  })

  test('maps JWT errors to 401', () => {
    expect(run(Object.assign(new Error('x'), { name: 'JsonWebTokenError' })).status).toBe(401)
    expect(run(Object.assign(new Error('x'), { name: 'TokenExpiredError' })).status).toBe(401)
  })

  test('hides internal error text in production', () => {
    const { status, body } = run(new Error('secret db detail'), 'production')
    expect(status).toBe(500)
    expect(JSON.stringify(body)).not.toContain('secret db detail')
  })
})

describe('timetable controller', () => {
  const entryQuery = (rows) => {
    const q = { populate: jest.fn(), sort: jest.fn() }
    q.populate.mockReturnValue(q)
    q.sort.mockResolvedValue(rows)
    return q
  }

  beforeEach(() => jest.clearAllMocks())

  test('lists entries in weekday order, then by period', async () => {
    TimetableEntry.find.mockReturnValue(entryQuery([
      { dayOfWeek: 'Friday', periodNumber: 1 },
      { dayOfWeek: 'Monday', periodNumber: 2 },
      { dayOfWeek: 'Monday', periodNumber: 1 },
    ]))
    const res = mockRes()

    await timetable.getTimetable({ query: {} }, res, jest.fn())

    const rows = res.json.mock.calls[0][0].data
    expect(rows.map((r) => `${r.dayOfWeek}${r.periodNumber}`)).toEqual(['Monday1', 'Monday2', 'Friday1'])
  })

  const createBody = (overrides = {}) => ({
    classId: 'c1', sectionId: 'A', subjectId: 's1', teacherId: 't1', dayOfWeek: 'Monday', periodNumber: 3, ...overrides,
  })
  const upsertQuery = (doc) => {
    const q = { populate: jest.fn() }
    q.populate.mockReturnValueOnce(q).mockReturnValueOnce(q).mockResolvedValueOnce(doc)
    return q
  }

  test('creating a new slot returns 201 and fills the default period time', async () => {
    TimetableEntry.exists.mockResolvedValue(null)
    TimetableEntry.findOneAndUpdate.mockReturnValue(upsertQuery({ _id: 'e1' }))
    const res = mockRes()

    await timetable.createTimetableEntry({ body: createBody({ periodNumber: 12 }) }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(201)
    const update = TimetableEntry.findOneAndUpdate.mock.calls[0][1]
    expect(update).toMatchObject({ startTime: '16:45', endTime: '17:30' })
  })

  test('updating an existing slot returns 200', async () => {
    TimetableEntry.exists.mockResolvedValue({ _id: 'e1' })
    TimetableEntry.findOneAndUpdate.mockReturnValue(upsertQuery({ _id: 'e1' }))
    const res = mockRes()

    await timetable.createTimetableEntry({ body: createBody() }, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('a teacher clash from the service stops the write', async () => {
    assertTeacherAvailable.mockRejectedValueOnce(new ApiError(409, 'Teacher is already assigned'))
    const next = jest.fn()

    await timetable.createTimetableEntry({ body: createBody() }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }))
    expect(TimetableEntry.findOneAndUpdate).not.toHaveBeenCalled()
  })

  test('missing schedule fields are rejected with 400', async () => {
    const next = jest.fn()

    await timetable.createTimetableEntry({ body: createBody({ teacherId: undefined }) }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  test('deleting an unknown period gives 404, a known one succeeds', async () => {
    TimetableEntry.findByIdAndDelete.mockResolvedValueOnce(null)
    const next = jest.fn()
    await timetable.deleteTimetableEntry({ params: { id: 'nope' } }, mockRes(), next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }))

    TimetableEntry.findByIdAndDelete.mockResolvedValueOnce({ _id: 'e1' })
    const res = mockRes()
    await timetable.deleteTimetableEntry({ params: { id: 'e1' } }, res, jest.fn())
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })
})
