const { z } = require('zod')

// 24-hex ObjectId strings only: rejects operator objects such as { $ne: null } before they
// can reach a query.
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')

const savePromotionConfigSchema = z.object({
  body: z.object({
    academicYearId: objectId,
    targetAcademicYearId: objectId.optional().nullable(),
    finalExamTermName: z.string().trim().min(1).max(60).optional(),
    mappings: z.array(z.object({
      fromClassId: objectId,
      toClassId: objectId,
    })).max(60),
  }),
})

const previewPromotionSchema = z.object({
  body: z.object({
    configId: objectId.optional(),
    academicYearId: objectId.optional(),
  }).refine((b) => b.configId || b.academicYearId, { message: 'configId or academicYearId is required' }),
})

const executePromotionSchema = z.object({
  body: z.object({
    configId: objectId,
    overrides: z.array(z.object({
      studentId: objectId,
      decision: z.enum(['promote', 'retain']),
    })).max(5000).optional(),
  }),
})

module.exports = { savePromotionConfigSchema, previewPromotionSchema, executePromotionSchema }
