const { z } = require('zod')

const createFeeStructureSchema = z.object({
  body: z.object({
    // Must match FeeStructure.feeType; any other string used to fail later as a Mongoose error
    feeType: z.enum(['Tuition', 'Admission', 'Exam', 'Other']),
    // Optional: defaults to '<feeType> Fee'. The model requires a title but the DTO never asked for one.
    title: z.string().trim().min(2).max(120).optional(),
    classId: z.string().min(1, 'Class is required'),
    academicYearId: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    dueDate: z.string().or(z.date()),
    isFixed: z.boolean().optional(),
  }),
})

const recordPaymentSchema = z.object({
  body: z.object({
    studentFeeId: z.string().min(1, 'Student fee ID is required'),
    amountPaid: z.number().positive('Amount paid must be greater than 0'),
    paymentMode: z.enum(['Cash', 'Bank Transfer', 'Online', 'Cheque', 'JazzCash', 'EasyPaisa']).optional(),
    referenceNo: z.string().optional(),
    remarks: z.string().optional(),
  }),
})

const applyConcessionSchema = z.object({
  body: z.object({
    studentFeeId: z.string().min(1, 'Student fee ID is required'),
    discountAmount: z.number().min(0, 'Discount amount cannot be negative'),
    concessionType: z.string().optional(),
    concessionReason: z.string().optional(),
  }),
})

const assignFeeToStudentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    feeStructureId: z.string().min(1, 'Fee structure ID is required'),
    discount: z.number().min(0).optional(),
    concessionType: z.string().optional(),
    concessionReason: z.string().optional(),
    dueDate: z.string().or(z.date()).optional(),
  }),
})

module.exports = {
  createFeeStructureSchema,
  recordPaymentSchema,
  applyConcessionSchema,
  assignFeeToStudentSchema,
}
