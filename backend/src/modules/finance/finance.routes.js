const express = require('express')
const router = express.Router()
const financeController = require('./finance.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  createFeeStructureSchema,
  recordPaymentSchema,
  applyConcessionSchema,
  assignFeeToStudentSchema,
} = require('./finance.dto')

router.use(verifyToken)

router.get('/structures', checkPermission(['super_admin', 'accountant', 'teacher', 'student', 'guardian'], 'finance', 'read'), financeController.getFeeStructures)
router.post('/structures', checkPermission(['super_admin', 'accountant'], 'finance', 'create'), validate(createFeeStructureSchema), financeController.createFeeStructure)

router.get('/student-fees', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.getStudentFees)
router.post('/student-fees/assign', checkPermission(['super_admin', 'accountant'], 'finance', 'create'), validate(assignFeeToStudentSchema), financeController.assignFeeToStudent)
router.post('/payments', checkPermission(['super_admin', 'accountant'], 'finance', 'create'), validate(recordPaymentSchema), financeController.recordPayment)
router.get('/receipt/:paymentId', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.downloadReceiptPDF)

router.get('/challan-settings', checkPermission(['super_admin', 'accountant'], 'finance', 'read'), financeController.getChallanSettings)
router.put('/challan-settings', checkPermission(['super_admin', 'accountant'], 'finance', 'update'), financeController.updateChallanSettings)

// Challan PDF generation (supporting all URL variants)
router.get('/challan/:feeId', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.downloadChallanPDF)
router.get('/challan/:feeId/pdf', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.downloadChallanPDF)
router.get('/challans/:feeId', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.downloadChallanPDF)
router.get('/challans/:feeId/pdf', checkPermission(['super_admin', 'accountant', 'student', 'guardian'], 'finance', 'read'), financeController.downloadChallanPDF)

router.post('/concession', checkPermission(['super_admin', 'accountant'], 'finance', 'create'), validate(applyConcessionSchema), financeController.applyConcession)

// Automated Monthly Challans
router.get('/monthly-challans/status', checkPermission(['super_admin', 'accountant'], 'finance', 'read'), financeController.getMonthlyChallansCronStatus)
router.post('/monthly-challans/generate', checkPermission(['super_admin', 'accountant'], 'finance', 'create'), financeController.triggerMonthlyChallansManually)

module.exports = router

