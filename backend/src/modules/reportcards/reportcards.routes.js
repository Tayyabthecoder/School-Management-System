const express = require('express')
const router = express.Router()
const reportcardsController = require('./reportcards.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')

router.use(verifyToken)

router.get('/class/:classId', checkPermission(['super_admin', 'teacher'], 'grades', 'read'), reportcardsController.bulkDownloadClassReportCards)
router.get('/:studentId/transcript/pdf', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), reportcardsController.downloadTranscriptPDF)
router.get('/:studentId/transcript', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), reportcardsController.getStudentTranscript)
router.get('/:studentId/pdf', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), reportcardsController.downloadReportCardPDF)
router.get('/:studentId', checkPermission(['super_admin', 'teacher', 'student', 'guardian'], 'grades', 'read'), reportcardsController.getReportCard)

module.exports = router
