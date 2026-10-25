const express = require('express')
const router = express.Router()
const subjectsController = require('./subjects.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { createSubjectSchema, updateSubjectSchema } = require('./subjects.dto')

router.use(verifyToken)

router.get('/', subjectsController.getSubjects)
router.get('/:id', subjectsController.getSubjectById)
router.post('/', checkPermission(['super_admin', 'teacher'], 'classes', 'create'), validate(createSubjectSchema), subjectsController.createSubject)
router.patch('/:id', checkPermission(['super_admin', 'teacher'], 'classes', 'update'), validate(updateSubjectSchema), subjectsController.updateSubject)
router.delete('/:id', checkPermission(['super_admin'], 'classes', 'delete'), subjectsController.deleteSubject)

module.exports = router
