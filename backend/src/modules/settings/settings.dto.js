const { z } = require('zod')
const { DAYS_OF_WEEK } = require('../../config/constants')

const updateSettingsSchema = z.object({
  body: z.object({
    attendanceAlertThreshold: z.coerce.number().min(50).max(100).optional(),
    autoFeeOverdueAlerts: z.boolean().optional(),
    allowedDays: z.array(z.enum(DAYS_OF_WEEK, {
      errorMap: () => ({ message: 'Invalid day of the week' }),
    })).min(1, 'At least one operating day must remain enabled').optional(),
    
    // Identification & Branding
    schoolName: z.string().trim().min(1, 'School name cannot be empty').max(150).optional(),
    schoolTagline: z.string().trim().max(200).optional(),
    regNo: z.string().trim().max(100).optional(),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code (e.g. #3730A3)').optional(),
    schoolAddress: z.string().trim().max(300).optional(),
    schoolPhone: z.string().trim().max(50).optional(),
    schoolEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
    hotline: z.string().trim().max(50).optional(),
    website: z.string().trim().max(150).optional(),

    // Regional & Localization
    currency: z.string().trim().max(10).optional(),
    timezone: z.string().trim().max(50).optional(),
    dateFormat: z.string().trim().max(20).optional(),

    // Academic Policies
    activeTerm: z.string().trim().max(50).optional(),
    passingPercentage: z.coerce.number().min(0).max(100).optional(),
    minAttendancePercentage: z.coerce.number().min(50).max(100).optional(),
    maxStudentsPerSection: z.coerce.number().int().min(5).max(100).optional(),

    // Grading Scale
    gradingScale: z.array(z.object({
      label: z.string().min(1, 'Grade label is required'),
      minPercent: z.coerce.number().min(0).max(100),
      maxPercent: z.coerce.number().min(0).max(100),
    })).min(1, 'gradingScale must be a non-empty array').optional(),
  }),
})

module.exports = { updateSettingsSchema }
