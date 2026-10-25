const { z } = require('zod')

const createStaffSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    cnic: z.string().min(5, 'CNIC is required'),
    phone: z.string().min(7, 'Phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
    designation: z.string().min(2, 'Designation is required'),
    department: z.string().min(2, 'Department is required'),
    joiningDate: z.string().or(z.date()).optional(),
    salary: z.number().min(0, 'Salary cannot be negative'),
  }),
})

const submitLeaveRequestSchema = z.object({
  body: z.object({
    staffId: z.string().min(1, 'Staff ID is required'),
    leaveType: z.enum(['Casual', 'Medical', 'Annual', 'Unpaid', 'Maternity', 'Paternity']),
    fromDate: z.string().or(z.date()),
    toDate: z.string().or(z.date()),
    reason: z.string().min(3, 'Reason is required'),
  }),
})

const reviewLeaveRequestSchema = z.object({
  body: z.object({
    leaveId: z.string().min(1, 'Leave ID is required'),
    status: z.enum(['Approved', 'Rejected']),
    reviewRemarks: z.string().optional(),
  }),
})

const runPayrollSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100),
  }),
})

module.exports = {
  createStaffSchema,
  submitLeaveRequestSchema,
  reviewLeaveRequestSchema,
  runPayrollSchema,
}
