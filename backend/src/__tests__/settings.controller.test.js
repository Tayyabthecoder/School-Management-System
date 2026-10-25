const settingsController = require('../modules/settings/settings.controller')
const SchoolSettings = require('../models/SchoolSettings.model')
const cacheUtil = require('../utils/cache.util')
const auditUtil = require('../utils/audit-log.util')

jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')

describe('Settings Controller Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    cacheUtil.getOrSet.mockImplementation((key, ttl, fn) => fn())
    cacheUtil.invalidateCache.mockResolvedValue(true)
    auditUtil.logAudit.mockResolvedValue(true)
  })

  describe('getSettings', () => {
    it('should return existing settings from cache/db', async () => {
      const mockDoc = {
        _id: 'settings-123',
        schoolName: 'Test Academy',
        allowedDays: ['Monday', 'Tuesday'],
        isActive: true,
      }
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDoc),
      })

      req = {}
      await settingsController.getSettings(req, res, next)

      expect(cacheUtil.getOrSet).toHaveBeenCalledWith('ref:school-settings', 60, expect.any(Function))
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockDoc })
    })

    it('should create default settings if none exist', async () => {
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      })
      const createdDoc = {
        _id: 'new-settings-123',
        attendanceAlertThreshold: 75,
        autoFeeOverdueAlerts: true,
        allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
      }
      SchoolSettings.create.mockResolvedValue(createdDoc)

      req = {}
      await settingsController.getSettings(req, res, next)

      expect(SchoolSettings.create).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ success: true, data: createdDoc })
    })

    it('should catch and forward errors to next middleware', async () => {
      const error = new Error('Database error')
      cacheUtil.getOrSet.mockRejectedValue(error)

      req = {}
      await settingsController.getSettings(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getAllowedDays', () => {
    it('should return day information and access status', async () => {
      const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
      const mockDoc = {
        allowedDays: [todayDay],
      }
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDoc),
      })

      req = {}
      await settingsController.getAllowedDays(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          today: todayDay,
          allowedDays: [todayDay],
          isAllowedToday: true,
        },
      })
    })

    it('should report isAllowedToday as false if today is not an allowed day', async () => {
      const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
      const otherDay = todayDay === 'Monday' ? 'Sunday' : 'Monday'
      const mockDoc = {
        allowedDays: [otherDay],
      }
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDoc),
      })

      req = {}
      await settingsController.getAllowedDays(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          today: todayDay,
          allowedDays: [otherDay],
          isAllowedToday: false,
        },
      })
    })

    it('should create default doc if none exists in database', async () => {
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      })
      SchoolSettings.create.mockResolvedValue({
        allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      })

      req = {}
      await settingsController.getAllowedDays(req, res, next)

      expect(SchoolSettings.create).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalled()
    })

    it('should handle errors gracefully via next(error)', async () => {
      const error = new Error('Lookup failure')
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockRejectedValue(error),
      })

      req = {}
      await settingsController.getAllowedDays(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('updateSettings', () => {
    it('should return 400 if allowedDays is not an array', async () => {
      req = {
        body: { allowedDays: 'Monday' },
      }

      await settingsController.updateSettings(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { message: 'allowedDays must be an array' },
        })
      )
    })

    it('should return 400 if allowedDays contains an invalid weekday', async () => {
      req = {
        body: { allowedDays: ['Monday', 'Funday'] },
      }

      await settingsController.updateSettings(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { message: 'Invalid day names: Funday' },
        })
      )
    })

    it('should return 400 if gradingScale is not a non-empty array', async () => {
      req = {
        body: { gradingScale: [] },
      }

      await settingsController.updateSettings(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { message: 'gradingScale must be a non-empty array' },
        })
      )
    })

    it('should return 400 if gradingScale items miss label or minPercent or maxPercent', async () => {
      req = {
        body: { gradingScale: [{ label: 'A' }] },
      }

      await settingsController.updateSettings(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { message: 'Each grade scale item must have label, minPercent, and maxPercent' },
        })
      )
    })

    it('should update existing settings doc and invalidate cache', async () => {
      const mockDoc = {
        _id: 'settings-123',
        schoolName: 'Old Name',
        save: jest.fn().mockResolvedValue(true),
      }
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDoc),
      })

      req = {
        body: {
          schoolName: 'New Model Academy',
          primaryColor: '#1E3A8A',
          allowedDays: ['Monday', 'Tuesday', 'Wednesday'],
          activeTerm: 'Term 2',
          passingPercentage: 45,
          minAttendancePercentage: 80,
          regNo: 'REG-12345',
        },
      }

      await settingsController.updateSettings(req, res, next)

      expect(mockDoc.schoolName).toBe('New Model Academy')
      expect(mockDoc.primaryColor).toBe('#1E3A8A')
      expect(mockDoc.allowedDays).toEqual(['Monday', 'Tuesday', 'Wednesday'])
      expect(mockDoc.activeTerm).toBe('Term 2')
      expect(mockDoc.passingPercentage).toBe(45)
      expect(mockDoc.minAttendancePercentage).toBe(80)
      expect(mockDoc.regNo).toBe('REG-12345')
      expect(mockDoc.save).toHaveBeenCalled()
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('ref:school-settings')
      expect(auditUtil.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE_SCHOOL_SETTINGS',
          module: 'settings',
        })
      )
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Settings updated successfully',
        })
      )
    })

    it('should create new settings doc if none exists when updating', async () => {
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      })
      const createdDoc = {
        _id: 'brand-new-doc',
        schoolName: 'Fresh Academy',
        isActive: true,
      }
      SchoolSettings.create.mockResolvedValue(createdDoc)

      req = {
        body: {
          schoolName: 'Fresh Academy',
          primaryColor: '#065F46',
        },
      }

      await settingsController.updateSettings(req, res, next)

      expect(SchoolSettings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolName: 'Fresh Academy',
          primaryColor: '#065F46',
          isActive: true,
        })
      )
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('ref:school-settings')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: createdDoc,
        })
      )
    })

    it('should forward unexpected errors to next()', async () => {
      const error = new Error('Database write failed')
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockRejectedValue(error),
      })

      req = {
        body: { schoolName: 'Test' },
      }

      await settingsController.updateSettings(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
