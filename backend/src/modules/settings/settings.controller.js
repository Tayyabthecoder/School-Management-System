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
          autoFeeOverdueAlerts: true,
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
    const today = dayNames[new Date().getDay()] // e.g. "Thursday"

    let doc = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
    if (!doc) {
      doc = await SchoolSettings.create({
        attendanceAlertThreshold: 75,
        autoFeeOverdueAlerts: true,
        allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
      })
    }

    const allowedDays = doc.allowedDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
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
      autoFeeOverdueAlerts,
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
      passingPercentage,
      minAttendancePercentage,
      maxStudentsPerSection,
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
      }
    }

    let doc = await SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 })
    
    if (!doc) {
      doc = await SchoolSettings.create({
        attendanceAlertThreshold: attendanceAlertThreshold ?? 75,
        autoFeeOverdueAlerts: autoFeeOverdueAlerts ?? true,
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
        passingPercentage: passingPercentage ?? 40,
        minAttendancePercentage: minAttendancePercentage ?? 75,
        maxStudentsPerSection: maxStudentsPerSection ?? 35,
        gradingScale: gradingScale,
        isActive: true,
      })
    } else {
      if (attendanceAlertThreshold !== undefined) doc.attendanceAlertThreshold = attendanceAlertThreshold
      if (autoFeeOverdueAlerts !== undefined) doc.autoFeeOverdueAlerts = autoFeeOverdueAlerts
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
      if (passingPercentage !== undefined) doc.passingPercentage = passingPercentage
      if (minAttendancePercentage !== undefined) doc.minAttendancePercentage = minAttendancePercentage
      if (maxStudentsPerSection !== undefined) doc.maxStudentsPerSection = maxStudentsPerSection
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
        autoFeeOverdueAlerts: doc.autoFeeOverdueAlerts,
        allowedDays: doc.allowedDays,
        schoolName: doc.schoolName,
        regNo: doc.regNo,
        primaryColor: doc.primaryColor,
        currency: doc.currency,
        activeTerm: doc.activeTerm,
        passingPercentage: doc.passingPercentage,
        minAttendancePercentage: doc.minAttendancePercentage,
        maxStudentsPerSection: doc.maxStudentsPerSection,
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
