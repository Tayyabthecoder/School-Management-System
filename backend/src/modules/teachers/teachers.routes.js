const express = require('express')
const router = express.Router()
const teachersController = require('./teachers.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  createTeacherSchema,
  assignTeacherPeriodSchema,
  reviewLeaveRequestSchema,
} = require('./teachers.dto')

router.use(verifyToken)

// Workspace & Class endpoints
router.get('/me/workspace', checkPermission(['super_admin', 'teacher'], 'academics', 'read'), teachersController.getTeacherWorkspace)
router.get('/me/my-classes', checkPermission(['super_admin', 'teacher'], 'academics', 'read'), teachersController.getMyClasses)

// Leave review endpoints
router.get('/leave-requests', checkPermission(['super_admin', 'teacher'], 'attendance', 'read'), teachersController.getTeacherLeaveRequests)
router.patch('/leave-requests/:id/review', checkPermission(['super_admin', 'teacher'], 'attendance', 'update'), validate(reviewLeaveRequestSchema), teachersController.reviewLeaveRequest)

// General directory & schedule endpoints
router.get('/', checkPermission(['super_admin', 'hr_manager', 'accountant', 'teacher'], 'staff', 'read'), teachersController.getTeachers)
router.get('/:id/schedule', checkPermission(['super_admin', 'teacher'], 'timetable', 'read'), teachersController.getTeacherSchedule)
router.post('/assign', checkPermission(['super_admin', 'teacher'], 'classes', 'update'), validate(assignTeacherPeriodSchema), teachersController.assignTeacherPeriod)
router.post('/', checkPermission(['super_admin', 'hr_manager'], 'hr', 'create'), validate(createTeacherSchema), teachersController.createTeacher)

module.exports = router
