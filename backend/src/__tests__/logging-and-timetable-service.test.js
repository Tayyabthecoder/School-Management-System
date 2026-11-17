// Small shared pieces: the winston logger's level and format, the request logger that must never log
// query strings, and the timetable service's conflict handling.

describe('logger level and stream', () => {
  const loadLogger = (nodeEnv) => {
    const saved = process.env.NODE_ENV
    process.env.NODE_ENV = nodeEnv
    try {
      let logger
      jest.isolateModules(() => { logger = require('../utils/logger') })
      return logger
    } finally {
      process.env.NODE_ENV = saved
    }
  }

  test('development logs everything down to debug; other environments from info up', () => {
    expect(loadLogger('development').level).toBe('debug')
    expect(loadLogger('production').level).toBe('info')
    expect(loadLogger('test').level).toBe('info')
  })

  test('the morgan-style stream writes trimmed lines at http level', () => {
    const logger = loadLogger('test')
    const http = jest.spyOn(logger, 'http').mockImplementation(() => logger)
    logger.stream.write('GET /api/v1/health 200 12 - 3 ms\n')
    expect(http).toHaveBeenCalledWith('GET /api/v1/health 200 12 - 3 ms')
  })

  test('every transport is silent under test, so the suite output stays clean', () => {
    const logger = loadLogger('test')
    expect(logger.transports.length).toBe(3)
    expect(logger.transports.every((t) => t.silent)).toBe(true)
  })

  test('the file format prints timestamp, level and the stack when there is one', () => {
    const logger = loadLogger('test')
    const fileFormat = logger.transports.find((t) => t.filename === 'error.log').format
    const render = (info) => fileFormat.transform({ ...info }, fileFormat.options)[Symbol.for('message')]

    expect(render({ level: 'error', message: 'boom' })).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d+\] \[ERROR\]: boom$/)
    expect(render({ level: 'error', message: 'boom', stack: 'at x' })).toMatch(/\[ERROR\]: boom\nat x$/)
  })
})

describe('request logger middleware', () => {
  // The middleware checks NODE_ENV each time it runs, so the call itself happens under the chosen value.
  const load = (nodeEnv) => {
    jest.resetModules()
    jest.doMock('../utils/logger', () => ({ http: jest.fn() }))
    const real = require('../middleware/logger.middleware')
    const logger = require('../utils/logger')
    const middleware = (req, res, next) => {
      const saved = process.env.NODE_ENV
      process.env.NODE_ENV = nodeEnv
      try { return real(req, res, next) } finally { process.env.NODE_ENV = saved }
    }
    return { middleware, logger }
  }
  const makeRes = (statusCode, length) => {
    const handlers = {}
    return { statusCode, on: (e, cb) => { handlers[e] = cb }, getHeader: () => length, finish: () => handlers.finish() }
  }
  afterEach(() => jest.dontMock('../utils/logger'))

  test('does nothing at all under test', () => {
    const { middleware, logger } = load('test')
    const res = makeRes(200)
    const next = jest.fn()
    middleware({ method: 'GET', originalUrl: '/x' }, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.finish).toBeDefined()
    expect(logger.http).not.toHaveBeenCalled()
  })

  test('logs method, path, status, size and time when the response finishes, and drops the query string', () => {
    const { middleware, logger } = load('development')
    const res = makeRes(200, '512')
    const next = jest.fn()

    middleware({ method: 'GET', originalUrl: '/api/v1/students?search=Hassan&cnic=3520112345671' }, res, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(logger.http).not.toHaveBeenCalled() // only once the response is done
    res.finish()

    expect(logger.http).toHaveBeenCalledTimes(1)
    const line = logger.http.mock.calls[0][0]
    expect(line).toMatch(/^GET \/api\/v1\/students 200 512 - \d+ ms$/)
    expect(line).not.toContain('Hassan')
    expect(line).not.toContain('cnic')
  })

  test('uses a dash when there is no content length, and falls back to req.url', () => {
    const { middleware, logger } = load('production')
    const res = makeRes(204, undefined)
    middleware({ method: 'DELETE', url: '/api/v1/x' }, res, jest.fn())
    res.finish()
    expect(logger.http.mock.calls[0][0]).toMatch(/^DELETE \/api\/v1\/x 204 - - \d+ ms$/)
  })

  test('copes with a request that has neither url field', () => {
    const { middleware, logger } = load('production')
    const res = makeRes(500, '0')
    middleware({ method: 'GET' }, res, jest.fn())
    res.finish()
    expect(logger.http.mock.calls[0][0]).toMatch(/^GET {2}500 0 - \d+ ms$/)
  })
})

describe('timetable service', () => {
  jest.mock('../models/TimetableEntry.model', () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn() }))
  const TimetableEntry = require('../models/TimetableEntry.model')
  const { assertTeacherAvailable, upsertTimetableEntry, TEACHER_PUBLIC_FIELDS } = require('../modules/timetable/timetable.service')

  const chain = (final) => {
    const q = { populate: jest.fn() }
    q.populate.mockReturnValueOnce(q).mockReturnValueOnce(q).mockImplementationOnce(() => final)
    return q
  }
  const slot = { classId: 'c1', sectionId: 'A', dayOfWeek: 'Monday', periodNumber: 3 }
  const fields = { subjectId: 's1', teacherId: 't1' }
  beforeEach(() => jest.clearAllMocks())

  test('only public staff fields are ever populated into timetable responses', () => {
    expect(TEACHER_PUBLIC_FIELDS.split(' ').sort()).toEqual(['department', 'designation', 'fullName', 'staffId'])
    expect(TEACHER_PUBLIC_FIELDS).not.toMatch(/salary|cnic|phone|bank/i)
  })

  describe('assertTeacherAvailable', () => {
    const args = { teacherId: 't1', ...slot }

    test('passes when the teacher has no other class in that period, excluding the slot being saved', async () => {
      TimetableEntry.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) })
      await expect(assertTeacherAvailable(args)).resolves.toBeUndefined()
      expect(TimetableEntry.findOne).toHaveBeenCalledWith({ teacherId: 't1', dayOfWeek: 'Monday', periodNumber: 3, $nor: [{ classId: 'c1', sectionId: 'A' }] })
    })

    test('a clash names the other class and section in the 409', async () => {
      TimetableEntry.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ classId: { name: 'Grade 5' }, sectionId: 'B' }) })
      await expect(assertTeacherAvailable(args)).rejects.toMatchObject({ statusCode: 409, message: 'Teacher is already assigned to Grade 5 (Section B) on Monday, Period 3' })
    })

    test('a clash whose class was deleted still reads sensibly', async () => {
      TimetableEntry.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue({ classId: null, sectionId: 'B' }) })
      await expect(assertTeacherAvailable(args)).rejects.toThrow('already assigned to another class (Section B)')
    })
  })

  describe('upsertTimetableEntry', () => {
    test('stamps the teacher/day/period key that the unique index enforces and returns the populated slot', async () => {
      TimetableEntry.findOneAndUpdate.mockReturnValue(chain({ saved: true }))

      expect(await upsertTimetableEntry(slot, fields)).toEqual({ saved: true })

      expect(TimetableEntry.findOneAndUpdate).toHaveBeenCalledWith(
        slot,
        { ...fields, teacherSlotKey: 't1|Monday|3' },
        { upsert: true, new: true, runValidators: true },
      )
    })

    test('a clash on the teacher key is a 409, not a server error', async () => {
      const dup = Object.assign(new Error('E11000'), { code: 11000, keyPattern: { teacherSlotKey: 1 } })
      TimetableEntry.findOneAndUpdate.mockImplementation(() => { throw dup })
      await expect(upsertTimetableEntry(slot, fields)).rejects.toMatchObject({ statusCode: 409, message: 'Teacher is already assigned to another class on Monday, Period 3' })
    })

    test('two writers racing to create the same slot: the loser retries once and succeeds', async () => {
      const dup = Object.assign(new Error('E11000'), { code: 11000, keyPattern: { classId: 1 } })
      TimetableEntry.findOneAndUpdate.mockImplementationOnce(() => { throw dup }).mockReturnValueOnce(chain({ won: true }))
      expect(await upsertTimetableEntry(slot, fields)).toEqual({ won: true })
      expect(TimetableEntry.findOneAndUpdate).toHaveBeenCalledTimes(2)
    })

    test('a second duplicate error is not retried forever', async () => {
      const dup = Object.assign(new Error('E11000'), { code: 11000, keyPattern: { classId: 1 } })
      TimetableEntry.findOneAndUpdate.mockImplementation(() => { throw dup })
      await expect(upsertTimetableEntry(slot, fields)).rejects.toBe(dup)
      expect(TimetableEntry.findOneAndUpdate).toHaveBeenCalledTimes(2)
    })

    test('any other error passes through untouched', async () => {
      const other = new Error('validation failed')
      TimetableEntry.findOneAndUpdate.mockImplementation(() => { throw other })
      await expect(upsertTimetableEntry(slot, fields)).rejects.toBe(other)
      expect(TimetableEntry.findOneAndUpdate).toHaveBeenCalledTimes(1)
    })
  })
})
