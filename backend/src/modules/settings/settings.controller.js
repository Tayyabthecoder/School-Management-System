const { getSchoolDayName } = require('../../utils/date.util')
const SchoolSettings = require('../../models/SchoolSettings.model')
const { getOrSet, invalidateCache } = require('../../utils/cache.util')
const { logAudit } = require('../../utils/audit-log.util')

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getSettings = async (req, res, next) => {
  try {
    const settings = await getOrSet('ref:school-settings', 60, async () => {
      let doc = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
      if (!doc) {
        doc = await SchoolSettings.create({
          attendanceAlertThreshold: 75,
          allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isActive: true,
        })
      }
      return doc
    })
    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

// Public endpoint — no auth token required
// Returns today's day name + whether access is allowed today
const getAllowedDays = async (req, res, next) => {
  try {
    const dayNames = ALL_DAYS
    const today = getSchoolDayName() // e.g. "Thursday", in the school's timezone

    // Unauthenticated: read-only. It must never create a settings document (that is done by the
    // authenticated getSettings), otherwise an anonymous caller could write to the database.
    const doc = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })

    const allowedDays = doc?.allowedDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const isAllowedToday = allowedDays.includes(today)

    res.json({
      success: true,
      data: {
        today,
        allowedDays,
        isAllowedToday,
      },
    })
  } catch (error) {
    next(error)
  }
}

const updateSettings = async (req, res, next) => {
  try {
    const payload = req.validatedData?.body || req.body
    const {
      attendanceAlertThreshold,
      allowedDays,
      schoolName,
      schoolTagline,
      regNo,
      primaryColor,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      hotline,
      website,
      currency,
      timezone,
      dateFormat,
      activeTerm,
      gradingScale,
    } = payload

    // Validate allowedDays if provided directly
    if (allowedDays !== undefined) {
      if (!Array.isArray(allowedDays)) {
        return res.status(400).json({ success: false, error: { message: 'allowedDays must be an array' } })
      }
      const invalid = allowedDays.filter(d => !ALL_DAYS.includes(d))
      if (invalid.length > 0) {
        return res.status(400).json({ success: false, error: { message: `Invalid day names: ${invalid.join(', ')}` } })
      }
    }

    if (gradingScale !== undefined) {
      if (!Array.isArray(gradingScale) || gradingScale.length === 0) {
        return res.status(400).json({ success: false, error: { message: 'gradingScale must be a non-empty array' } })
      }
      for (const item of gradingScale) {
        if (!item.label || typeof item.minPercent !== 'number' || typeof item.maxPercent !== 'number') {
          return res.status(400).json({ success: false, error: { message: 'Each grade scale item must have label, minPercent, and maxPercent' } })
        }
        if (item.minPercent > item.maxPercent) {
          return res.status(400).json({ success: false, error: { message: `Grade "${item.label}": minPercent cannot be greater than maxPercent` } })
        }
      }
    }

    let doc = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
    
    if (!doc) {
      doc = await SchoolSettings.create({
        attendanceAlertThreshold: attendanceAlertThreshold ?? 75,
        allowedDays: allowedDays ?? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        schoolName: schoolName ? schoolName.trim() : 'School Management System',
        schoolTagline: schoolTagline ? schoolTagline.trim() : '',
        regNo: regNo ? regNo.trim() : '',
        primaryColor: primaryColor ? primaryColor.trim() : '#3730A3',
        schoolAddress: schoolAddress ? schoolAddress.trim() : '',
        schoolPhone: schoolPhone ? schoolPhone.trim() : '',
        schoolEmail: schoolEmail ? schoolEmail.trim() : '',
        hotline: hotline ? hotline.trim() : '',
        website: website ? website.trim() : '',
        currency: currency ? currency.trim() : 'PKR',
        timezone: timezone ? timezone.trim() : 'Asia/Karachi (GMT+5)',
        dateFormat: dateFormat ? dateFormat.trim() : 'DD/MM/YYYY',
        activeTerm: activeTerm ? activeTerm.trim() : 'Term 1',
        gradingScale: gradingScale,
        isActive: true,
      })
    } else {
      if (attendanceAlertThreshold !== undefined) doc.attendanceAlertThreshold = attendanceAlertThreshold
      if (allowedDays !== undefined) doc.allowedDays = allowedDays
      if (schoolName !== undefined) doc.schoolName = schoolName.trim()
      if (schoolTagline !== undefined) doc.schoolTagline = schoolTagline.trim()
      if (regNo !== undefined) doc.regNo = regNo.trim()
      if (primaryColor !== undefined) doc.primaryColor = primaryColor.trim()
      if (schoolAddress !== undefined) doc.schoolAddress = schoolAddress.trim()
      if (schoolPhone !== undefined) doc.schoolPhone = schoolPhone.trim()
      if (schoolEmail !== undefined) doc.schoolEmail = schoolEmail.trim()
      if (hotline !== undefined) doc.hotline = hotline.trim()
      if (website !== undefined) doc.website = website.trim()
      if (currency !== undefined) doc.currency = currency.trim()
      if (timezone !== undefined) doc.timezone = timezone.trim()
      if (dateFormat !== undefined) doc.dateFormat = dateFormat.trim()
      if (activeTerm !== undefined) doc.activeTerm = activeTerm.trim()
      if (gradingScale !== undefined) doc.gradingScale = gradingScale
      await doc.save()
    }

    await invalidateCache('ref:school-settings')

    await logAudit({
      req,
      action: 'UPDATE_SCHOOL_SETTINGS',
      module: 'settings',
      documentId: doc._id,
      newValues: {
        attendanceAlertThreshold: doc.attendanceAlertThreshold,
        allowedDays: doc.allowedDays,
        schoolName: doc.schoolName,
        regNo: doc.regNo,
        primaryColor: doc.primaryColor,
        currency: doc.currency,
        activeTerm: doc.activeTerm,
        gradingScale: doc.gradingScale,
      },
    })

    res.json({ success: true, message: 'Settings updated successfully', data: doc })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getSettings,
  getAllowedDays,
  updateSettings,
}
