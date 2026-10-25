const express = require('express')
const router = express.Router()
const hrController = require('./hr.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  createStaffSchema,
  submitLeaveRequestSchema,
  reviewLeaveRequestSchema,
  runPayrollSchema,
} = require('./hr.dto')

router.use(verifyToken)

router.get('/staff', checkPermission(['super_admin', 'hr_manager', 'accountant'], 'hr', 'read'), hrController.getStaffList)
router.post('/staff', checkPermission(['super_admin', 'hr_manager'], 'hr', 'create'), validate(createStaffSchema), hrController.createStaff)

router.get('/leave', checkPermission(['super_admin', 'hr_manager', 'teacher', 'accountant'], 'hr', 'read'), hrController.getLeaveRequests)
router.post('/leave', checkPermission(['super_admin', 'hr_manager', 'teacher', 'accountant'], 'hr', 'create'), validate(submitLeaveRequestSchema), hrController.submitLeaveRequest)
router.put('/leave/review', checkPermission(['super_admin', 'hr_manager'], 'hr', 'update'), validate(reviewLeaveRequestSchema), hrController.reviewLeaveRequest)

router.post('/payroll/run', checkPermission(['super_admin', 'hr_manager'], 'payroll', 'create'), validate(runPayrollSchema), hrController.runPayroll)
router.put('/payroll/finalize', checkPermission(['super_admin', 'hr_manager'], 'payroll', 'update'), validate(runPayrollSchema), hrController.finalizePayroll)
router.get('/payroll', checkPermission(['super_admin', 'hr_manager', 'accountant'], 'payroll', 'read'), hrController.getPayrollRecords)
router.get('/payroll/payslip/:id', checkPermission(['super_admin', 'hr_manager', 'accountant', 'teacher'], 'payroll', 'read'), hrController.downloadPayslipPDF)

module.exports = router
