const express = require('express')
const router = express.Router()
const timetableController = require('./timetable.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { createTimetableEntrySchema } = require('./timetable.dto')

router.use(verifyToken)

router.get('/', timetableController.getTimetable)
router.post('/', checkPermission(['super_admin', 'teacher'], 'timetable', 'create'), validate(createTimetableEntrySchema), timetableController.createTimetableEntry)
router.delete('/:id', checkPermission(['super_admin', 'teacher'], 'timetable', 'delete'), timetableController.deleteTimetableEntry)

module.exports = router
