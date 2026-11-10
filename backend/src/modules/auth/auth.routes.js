const express = require('express')
const router = express.Router()
const authController = require('./auth.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { loginSchema, changePasswordSchema } = require('./auth.dto')

router.post('/login', validate(loginSchema), authController.login)
router.post('/refresh', authController.refreshToken)
// No verifyToken: logout must succeed even with an expired access token or on a
// day-restricted day, otherwise the refresh-token cookie would never be revoked.
router.post('/logout', authController.logout)
router.get('/me', verifyToken, authController.getMe)
router.post('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword)

module.exports = router
