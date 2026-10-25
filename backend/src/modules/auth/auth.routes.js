const express = require('express')
const router = express.Router()
const authController = require('./auth.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { validate } = require('../../middleware/validate.middleware')
const { loginSchema, changePasswordSchema } = require('./auth.dto')

router.post('/login', validate(loginSchema), authController.login)
router.post('/refresh', authController.refreshToken)
router.post('/logout', verifyToken, authController.logout)
router.get('/me', verifyToken, authController.getMe)
router.post('/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword)

module.exports = router
