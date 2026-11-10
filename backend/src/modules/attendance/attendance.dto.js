const { z } = require('zod')

const markStudentAttendanceSchema = z.object({
  body: z.object({
    classId: z.string().min(1, 'Class ID is required'),
    sectionId: z.string().min(1, 'Section ID is required'),
    date: z.string().or(z.date()).optional(),
    periodNumber: z.number().int().min(0).optional(),
    records: z.array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        status: z.enum(['Present', 'Absent', 'Late', 'Excused']),
        remarks: z.string().optional(),
      })
    ).min(1, 'Attendance records are required'),
  }),
})

const markStaffAttendanceSchema = z.object({
  body: z.object({
    staffId: z.string().min(1, 'Staff ID is required'),
    date: z.string().or(z.date()).optional(),
    // 'Leave' is the legacy spelling and is stored as 'On Leave' (LOW-13)
    status: z.enum(['Present', 'Absent', 'Late', 'On Leave', 'Leave', 'Half Day']),
    remarks: z.string().optional(),
  }),
})

module.exports = {
  markStudentAttendanceSchema,
  markStaffAttendanceSchema,
}
