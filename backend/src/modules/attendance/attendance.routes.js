const express = require('express')
const router = express.Router()
const attendanceController = require('./attendance.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  markStudentAttendanceSchema,
  markStaffAttendanceSchema,
} = require('./attendance.dto')

router.use(verifyToken)

router.post('/student', checkPermission(['super_admin', 'teacher'], 'attendance', 'create'), validate(markStudentAttendanceSchema), attendanceController.markStudentAttendance)
router.get('/student', checkPermission(['super_admin', 'teacher', 'hr_manager'], 'attendance', 'read'), attendanceController.getStudentAttendance)

router.post('/staff', checkPermission(['super_admin', 'hr_manager'], 'attendance', 'create'), validate(markStaffAttendanceSchema), attendanceController.markStaffAttendance)
router.get('/staff', checkPermission(['super_admin', 'hr_manager', 'accountant'], 'attendance', 'read'), attendanceController.getStaffAttendance)

module.exports = router
