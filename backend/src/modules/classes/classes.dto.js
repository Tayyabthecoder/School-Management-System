const { z } = require('zod')

const createClassSchema = z.object({
  body: z.object({
    name: z.string({ error: (issue) => (issue.input === undefined ? 'Class name is required' : undefined) }).trim().min(1, 'Class name cannot be empty').max(50),
    level: z.coerce.number({ error: (issue) => (issue.input === undefined ? 'Level is required' : undefined) }).int().min(1).max(20),
    sections: z.union([
      z.array(z.string().trim().min(1).max(10)),
      z.string().trim().min(1),
    ]).optional(),
  }),
})

const addSectionSchema = z.object({
  body: z.object({
    sectionName: z.string({ error: (issue) => (issue.input === undefined ? 'Section name is required' : undefined) }).trim().min(1, 'Section name cannot be empty').max(10),
  }),
})

const createAcademicYearSchema = z.object({
  body: z.object({
    // The model stores a number and the settings UI sends one; a string-only rule rejected every create.
    year: z.coerce.number({ error: (issue) => (issue.input === undefined ? 'Academic year is required' : undefined) }).int().min(2000).max(2100),
    startDate: z.coerce.date({ error: (issue) => (issue.input === undefined ? 'Start date is required' : undefined) }),
    endDate: z.coerce.date({ error: (issue) => (issue.input === undefined ? 'End date is required' : undefined) }),
    terms: z.array(z.any()).optional(),
  }),
})

module.exports = {
  createClassSchema,
  addSectionSchema,
  createAcademicYearSchema,
}
