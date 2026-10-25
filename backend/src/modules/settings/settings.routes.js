const express = require('express')
const router = express.Router()
const settingsController = require('./settings.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { updateSettingsSchema } = require('./settings.dto')

// Public route: no auth required — used by Login page and pre-auth checks
router.get('/allowed-days', settingsController.getAllowedDays)

router.use(verifyToken)

router.get('/', settingsController.getSettings)
router.patch('/', checkPermission(['super_admin'], 'settings', 'update'), validate(updateSettingsSchema), settingsController.updateSettings)
router.put('/', checkPermission(['super_admin'], 'settings', 'update'), validate(updateSettingsSchema), settingsController.updateSettings)

module.exports = router
