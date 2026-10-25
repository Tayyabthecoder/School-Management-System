const { z } = require('zod')

const createClassSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Class name is required' }).trim().min(1, 'Class name cannot be empty').max(50),
    level: z.coerce.number({ required_error: 'Level is required' }).int().min(1).max(20),
    sections: z.union([
      z.array(z.string().trim().min(1).max(10)),
      z.string().trim().min(1),
    ]).optional(),
  }),
})

const addSectionSchema = z.object({
  body: z.object({
    sectionName: z.string({ required_error: 'Section name is required' }).trim().min(1, 'Section name cannot be empty').max(10),
  }),
})

const createAcademicYearSchema = z.object({
  body: z.object({
    year: z.string({ required_error: 'Academic year is required' }).trim().min(4).max(20),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    terms: z.array(z.any()).optional(),
  }),
})

module.exports = {
  createClassSchema,
  addSectionSchema,
  createAcademicYearSchema,
}
