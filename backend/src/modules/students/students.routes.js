const express = require('express')
const router = express.Router()
const studentsController = require('./students.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const {
  createStudentSchema,
  updateStudentSchema,
  bulkImportSchema,
} = require('./students.dto')
const { upload } = require('../../middleware/upload.middleware')

const promotionController = require('./promotion.controller')

router.use(verifyToken)

// Student Portal data endpoint
router.get('/me/portal', studentsController.getStudentPortalData)

// Promotion endpoints
router.get('/promotion/config', checkPermission(['super_admin']), promotionController.getPromotionConfig)
router.post('/promotion/config', checkPermission(['super_admin']), promotionController.savePromotionConfig)
router.post('/promotion/preview', checkPermission(['super_admin']), promotionController.previewPromotion)
router.post('/promotion/execute', checkPermission(['super_admin']), promotionController.executePromotion)

// Excel template & bulk upload endpoints (must precede /:id)
router.get('/import-template', checkPermission(['super_admin', 'hr_manager'], 'students', 'read'), studentsController.downloadImportTemplate)
router.post('/import-excel', checkPermission(['super_admin', 'hr_manager'], 'students', 'create'), upload.single('file'), studentsController.importStudentsFromExcel)

// Standard CRUD
router.get('/', checkPermission(['super_admin', 'teacher', 'accountant', 'hr_manager'], 'students', 'read'), studentsController.getStudents)
router.get('/:id', checkPermission(['super_admin', 'teacher', 'accountant', 'hr_manager', 'student', 'guardian'], 'students', 'read'), studentsController.getStudentById)
router.post('/', checkPermission(['super_admin', 'hr_manager'], 'students', 'create'), validate(createStudentSchema), studentsController.createStudent)
router.post('/import', checkPermission(['super_admin', 'hr_manager'], 'students', 'create'), validate(bulkImportSchema), studentsController.bulkImportStudents)
router.put('/:id', checkPermission(['super_admin', 'hr_manager'], 'students', 'update'), validate(updateStudentSchema), studentsController.updateStudent)
router.patch('/:id/section', checkPermission(['super_admin', 'hr_manager'], 'students', 'update'), studentsController.changeStudentSection)
router.delete('/:id', checkPermission(['super_admin'], 'students', 'delete'), studentsController.deleteStudent)

module.exports = router
