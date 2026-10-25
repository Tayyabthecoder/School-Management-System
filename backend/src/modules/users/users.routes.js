const express = require('express')
const router = express.Router()
const usersController = require('./users.controller')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')

const { validate } = require('../../middleware/validate.middleware')
const { createUserSchema, resetPasswordSchema } = require('./users.dto')

router.use(verifyToken)

router.get('/', checkPermission(['super_admin'], 'users', 'read'), usersController.getUsers)
router.post('/', checkPermission(['super_admin'], 'users', 'create'), validate(createUserSchema), usersController.createUser)
router.put('/:id/reset-password', checkPermission(['super_admin'], 'users', 'update'), validate(resetPasswordSchema), usersController.resetPassword)

module.exports = router
