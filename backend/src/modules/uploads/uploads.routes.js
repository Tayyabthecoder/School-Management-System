const express = require('express')
const router = express.Router()
const uploadsController = require('./uploads.controller')
const { upload, uploadImage } = require('../../middleware/upload.middleware')
const { verifyToken } = require('../../middleware/auth.middleware')
const { checkPermission } = require('../../middleware/rbac.middleware')

router.use(verifyToken)

// Upload generic file / document
router.post(
  '/file',
  checkPermission(['super_admin', 'hr_manager', 'teacher', 'accountant']),
  upload.single('file'),
  uploadsController.uploadSingleFile
)

// Upload photo / image
router.post(
  '/image',
  checkPermission(['super_admin', 'hr_manager', 'teacher']),
  uploadImage.single('image'),
  uploadsController.uploadSingleFile
)

// Attach document to student
router.post(
  '/student/:studentId/documents',
  checkPermission(['super_admin', 'hr_manager'], 'students', 'update'),
  upload.single('document'),
  uploadsController.uploadStudentDocument
)

// Update student photo
router.post(
  '/student/:studentId/photo',
  checkPermission(['super_admin', 'hr_manager'], 'students', 'update'),
  uploadImage.single('photo'),
  uploadsController.uploadStudentPhoto
)

module.exports = router
