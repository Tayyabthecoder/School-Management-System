const { z } = require('zod')

const createTeacherSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Full name must be at least 2 characters').max(100),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Invalid email address').optional(),
    cnic: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    department: z.string().trim().optional(),
    joiningDate: z.string().or(z.date()).optional(),
    salary: z.coerce.number().min(0).optional(),
    qualification: z.string().trim().optional(),
  }),
})

const assignTeacherPeriodSchema = z.object({
  body: z.object({
    classId: z.string({ required_error: 'classId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid classId ObjectId'),
    sectionId: z.string({ required_error: 'sectionId is required' }).trim().min(1),
    subjectId: z.string({ required_error: 'subjectId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid subjectId ObjectId'),
    teacherId: z.string({ required_error: 'teacherId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid teacherId ObjectId'),
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
      errorMap: () => ({ message: 'dayOfWeek must be a valid weekday' }),
    }),
    periodNumber: z.coerce.number({ required_error: 'periodNumber is required' }).int().min(1).max(12),
    startTime: z.string().trim().optional(),
    endTime: z.string().trim().optional(),
    room: z.string().trim().optional(),
  }),
})

const reviewLeaveRequestSchema = z.object({
  body: z.object({
    status: z.enum(['Approved', 'Rejected'], {
      errorMap: () => ({ message: "Status must be either 'Approved' or 'Rejected'" }),
    }),
    remarks: z.string().trim().max(500).optional(),
  }),
})

module.exports = {
  createTeacherSchema,
  assignTeacherPeriodSchema,
  reviewLeaveRequestSchema,
}
