const { z } = require('zod')

// z.coerce turns a missing field into NaN / Invalid Date before the error callback runs, so a
// "... is required" message never appeared (callers saw "expected number, received NaN"). These keep a
// missing value as undefined so the required message is the one that is reported.
const requiredNumber = (label) => z.preprocess(
  (v) => (v === undefined || v === null || v === '' ? undefined : Number(v)),
  z.number({ error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a number`) }),
)
const requiredDate = (label) => z.preprocess(
  (v) => (v === undefined || v === null || v === '' ? undefined : new Date(v)),
  z.date({ error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be a valid date`) }),
)

const createClassSchema = z.object({
  body: z.object({
    name: z.string({ error: (issue) => (issue.input === undefined ? 'Class name is required' : undefined) }).trim().min(1, 'Class name cannot be empty').max(50),
    level: requiredNumber('Level').pipe(z.number().int().min(1).max(20)),
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
    year: requiredNumber('Academic year').pipe(z.number().int().min(2000).max(2100)),
    startDate: requiredDate('Start date'),
    endDate: requiredDate('End date'),
    terms: z.array(z.any()).optional(),
  }),
})

module.exports = {
  createClassSchema,
  addSectionSchema,
  createAcademicYearSchema,
}
