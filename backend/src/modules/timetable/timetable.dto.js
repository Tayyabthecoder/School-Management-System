const { z } = require('zod')

const createTimetableEntrySchema = z.object({
  body: z.object({
    classId: z.string().min(1, 'Class ID is required'),
    sectionId: z.string().min(1, 'Section ID is required'),
    subjectId: z.string().min(1, 'Subject ID is required'),
    teacherId: z.string().min(1, 'Teacher ID is required'),
    dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    periodNumber: z.number().int().min(1).max(12),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    room: z.string().optional(),
  }),
})

module.exports = {
  createTimetableEntrySchema,
}
