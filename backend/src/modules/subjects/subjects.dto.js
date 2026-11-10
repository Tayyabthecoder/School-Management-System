const { z } = require('zod')

const createSubjectSchema = z.object({
  body: z.object({
    name: z.string({ error: (issue) => (issue.input === undefined ? 'Subject name is required' : undefined) }).trim().min(1, 'Subject name cannot be empty').max(100),
    code: z.string({ error: (issue) => (issue.input === undefined ? 'Subject code is required' : undefined) }).trim().min(1, 'Subject code cannot be empty').max(20),
    classId: z.string({ error: (issue) => (issue.input === undefined ? 'classId is required' : undefined) }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid classId ObjectId'),
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
