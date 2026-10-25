const { z } = require('zod')

const createStudentSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    dob: z.string().or(z.date()),
    gender: z.enum(['Male', 'Female', 'Other']),
    classId: z.string().min(1, 'Class is required'),
    sectionId: z.string().min(1, 'Section is required'),
    guardian: z.object({
      name: z.string().min(2, 'Guardian name is required'),
      phone: z.string().min(7, 'Guardian phone is required'),
      email: z.string().email().optional().or(z.literal('')),
      relationship: z.string().optional(),
      cnic: z.string().optional(),
      occupation: z.string().optional(),
    }),
    bloodGroup: z.string().optional(),
    bFormNumber: z.string().optional(),
    nationality: z.string().optional(),
    religion: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    medicalNotes: z.string().optional(),
    previousSchool: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    fatherName: z.string().optional(),
    photoUrl: z.string().optional().or(z.literal('')),
    joiningDate: z.string().or(z.date()).optional(),
    feeSetup: z.object({
      selectedFeeStructureIds: z.array(z.string()).optional(),
      concessionType: z.enum([
        'None',
        'Merit Scholarship',
        'Need-Based Aid',
        'Sibling Discount',
        'Staff Ward Concession',
        'Kinship Relief',
        'Special Management Discount',
      ]).optional(),
      discountType: z.enum(['percentage', 'fixed']).optional(),
      discountValue: z.number().min(0).optional(),
      concessionReason: z.string().optional(),
      initialPaymentStatus: z.enum(['Pending', 'Paid']).optional(),
      paymentMode: z.enum(['Cash', 'Bank Transfer', 'Online', 'Cheque']).optional(),
      paymentRemarks: z.string().optional(),
    }).optional(),
  }),
})

const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }).optional(),
  body: z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().or(z.date()).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    classId: z.string().optional(),
    sectionId: z.string().optional(),
    guardian: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      relationship: z.string().optional(),
      cnic: z.string().optional(),
      occupation: z.string().optional(),
    }).optional(),
    bloodGroup: z.string().optional(),
    bFormNumber: z.string().optional(),
    nationality: z.string().optional(),
    religion: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    medicalNotes: z.string().optional(),
    previousSchool: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    fatherName: z.string().optional(),
    photoUrl: z.string().optional().or(z.literal('')),
    joiningDate: z.string().or(z.date()).optional(),
  }),
})

const bulkImportSchema = z.object({
  body: z.object({
    students: z.array(
      z.object({
        fullName: z.string().min(2, 'Full name is required'),
        dob: z.string().or(z.date()).optional(),
        gender: z.enum(['Male', 'Female', 'Other']).optional(),
        classId: z.string().min(1, 'Class is required'),
        sectionId: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
      })
    ).min(1, 'At least one student record is required'),
  }),
})

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  bulkImportSchema,
}
