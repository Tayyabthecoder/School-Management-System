const express = require('express')
const router = express.Router()
const gradesController = require('./grades.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  createExamSchema,
  saveGradesSchema,
} = require('./grades.dto')

router.use(verifyToken)

router.get('/exams', gradesController.getExams)
router.post('/exams', checkPermission(['super_admin', 'teacher'], 'grades', 'create'), validate(createExamSchema), gradesController.createExam)

router.get('/entry/:examId', checkPermission(['super_admin', 'teacher'], 'grades', 'read'), gradesController.getGradesByExam)
router.post('/entry', checkPermission(['super_admin', 'teacher'], 'grades', 'create'), validate(saveGradesSchema), gradesController.saveGrades)

router.get('/report-card', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), gradesController.generateReportCard)
router.get('/student/:studentId', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), gradesController.getGradesByStudent)
router.patch('/exams/:id/publish', checkPermission(['super_admin', 'teacher'], 'grades', 'update'), gradesController.publishExam)

module.exports = router
