const { z } = require('zod')

const createSubjectSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Subject name is required' }).trim().min(1, 'Subject name cannot be empty').max(100),
    code: z.string({ required_error: 'Subject code is required' }).trim().min(1, 'Subject code cannot be empty').max(20),
    classId: z.string({ required_error: 'classId is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid classId ObjectId'),
    description: z.string().max(500).optional(),
  }),
})

const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    code: z.string().trim().min(1).max(20).optional(),
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
})

module.exports = {
  createSubjectSchema,
  updateSubjectSchema,
}
