const { z } = require('zod')

const createExamSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Exam title is required'),
    academicYearId: z.string().min(1, 'Academic year is required'),
    termName: z.string().min(1, 'Term name is required'),
    classId: z.string().min(1, 'Class is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    examDate: z.string().or(z.date()),
    maxMarks: z.number().positive().default(100),
    passMarks: z.number().positive().default(40),
    isPublished: z.boolean().optional(),
  }),
})

const saveGradesSchema = z.object({
  body: z.object({
    examId: z.string().min(1, 'Exam ID is required'),
    grades: z.array(
      z.object({
        studentId: z.string().min(1, 'Student ID is required'),
        marksObtained: z.number().min(0, 'Marks cannot be negative'),
        remarks: z.string().optional(),
      })
    ).min(1, 'At least one student grade entry is required'),
  }),
})

module.exports = {
  createExamSchema,
  saveGradesSchema,
}
