const express = require('express')
const router = express.Router()
const classesController = require('./classes.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { createClassSchema, addSectionSchema, createAcademicYearSchema } = require('./classes.dto')
const { createSubjectSchema } = require('../subjects/subjects.dto')

router.use(verifyToken)

router.get('/', classesController.getClasses)
router.post('/', checkPermission(['super_admin'], 'classes', 'create'), validate(createClassSchema), classesController.createClass)
router.delete('/:id', checkPermission(['super_admin'], 'classes', 'delete'), classesController.deleteClass)
router.post('/:id/sections', checkPermission(['super_admin'], 'classes', 'create'), validate(addSectionSchema), classesController.addSectionToClass)
router.delete('/:id/sections/:sectionName', checkPermission(['super_admin'], 'classes', 'delete'), classesController.deleteSectionFromClass)
router.delete('/:id/sections', checkPermission(['super_admin'], 'classes', 'delete'), classesController.deleteSectionFromClass)

router.get('/subjects', classesController.getSubjects)
router.post('/subjects', checkPermission(['super_admin'], 'classes', 'create'), validate(createSubjectSchema), classesController.createSubject)

router.get('/academic-years', classesController.getAcademicYears)
router.post('/academic-years', checkPermission(['super_admin'], 'classes', 'create'), validate(createAcademicYearSchema), classesController.createAcademicYear)

module.exports = router
