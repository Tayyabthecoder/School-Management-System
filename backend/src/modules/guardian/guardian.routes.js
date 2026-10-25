const express = require('express')
const router = express.Router()
const guardianController = require('./guardian.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')

router.use(verifyToken)

router.get('/my-child', checkPermission(['guardian', 'super_admin', 'student']), guardianController.getMyChild)
router.get('/attendance', checkPermission(['guardian', 'super_admin', 'student']), guardianController.getChildAttendance)
router.get('/grades', checkPermission(['guardian', 'super_admin', 'student']), guardianController.getChildGrades)
router.get('/fees', checkPermission(['guardian', 'super_admin', 'student']), guardianController.getChildFees)

router.post('/leave-requests', checkPermission(['guardian', 'super_admin']), guardianController.submitLeaveRequest)
router.get('/leave-requests', checkPermission(['guardian', 'super_admin']), guardianController.getGuardianLeaveRequests)

module.exports = router
