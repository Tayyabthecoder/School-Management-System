const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const { UPLOADS_DIR } = require('../../middleware/upload.middleware')
const { ApiError } = require('../../middleware/error.middleware')
const Student = require('../../models/Student.model')

const ALLOWED_SUBFOLDERS = new Set(['photos', 'documents', 'general'])
const FULL_ACCESS_ROLES = new Set(['super_admin', 'hr_manager'])
const SELF_SERVICE_ROLES = new Set(['student', 'guardian'])

const INLINE_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

// Images may render inline (profile photos); everything else downloads, and no served file can run script.
const setSafeHeaders = (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; img-src 'self' data:")
  if (!INLINE_IMAGE_EXT.has(path.extname(filePath).toLowerCase())) {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath).replace(/"/g, '')}"`)
  }
}

const roleOf =(user) => user?.roleName || (typeof user?.role === 'object' ? user.role?.name : user?.role)

/**
 * SEC-05: any authenticated user could previously fetch any upload by name.
 * - super_admin / hr_manager (who manage student records) may open any file.
 * - students and guardians must use GET /students/:id/documents/:docId, which checks ownership.
 * - other staff may open photos and general files, but never a file attached to a student
 *   record and nothing in the documents folder.
 */
const authorizeUploadAccess = async (req, subfolder, safeFilename) => {
  const role = roleOf(req.user)
  if (FULL_ACCESS_ROLES.has(role)) return
  if (!role || SELF_SERVICE_ROLES.has(role)) {
    throw new ApiError(403, 'Open this file from the student profile instead')
  }
  if (subfolder === 'documents') {
    throw new ApiError(403, 'You are not allowed to open student documents')
  }
  const url = subfolder ? `/uploads/${subfolder}/${safeFilename}` : null
  const candidates = url ? [url] : [...ALLOWED_SUBFOLDERS].map((s) => `/uploads/${s}/${safeFilename}`)
  if (await Student.exists({ 'documents.url': { $in: candidates } })) {
    throw new ApiError(403, 'You are not allowed to open student documents')
  }
}

/**
 * Authenticated and sanitized file serving endpoint
 * GET /api/v1/uploads/file/:subfolder/:filename or /uploads/:subfolder/:filename
 */
router.get('/:subfolder/:filename', async (req, res, next) => {
  try {
    const { subfolder, filename } = req.params

    if (!ALLOWED_SUBFOLDERS.has(subfolder)) {
      throw new ApiError(404, 'Invalid uploads category')
    }

    // path.basename strictly prevents directory traversal attacks
    const safeFilename = path.basename(filename)
    await authorizeUploadAccess(req, subfolder, safeFilename)
    const filePath = path.join(UPLOADS_DIR, subfolder, safeFilename)

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, 'File not found')
    }

    // Set secure response headers for served files
    setSafeHeaders(res, filePath)
    res.sendFile(filePath, (err) => {
      if (err) {
        next(err)
      }
    })
  } catch (error) {
    next(error)
  }
})

// Support root-level filename for backwards compatibility if any legacy upload is in root
router.get('/:filename', async (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.filename)
    await authorizeUploadAccess(req, null, safeFilename)

    // Check subfolders first (documents only for roles that may open them)
    const role = roleOf(req.user)
    for (const subfolder of ALLOWED_SUBFOLDERS) {
      if (subfolder === 'documents' && !FULL_ACCESS_ROLES.has(role)) continue
      const candidatePath = path.join(UPLOADS_DIR, subfolder, safeFilename)
      if (fs.existsSync(candidatePath)) {
        setSafeHeaders(res, candidatePath)
        return res.sendFile(candidatePath)
      }
    }

    const rootPath = path.join(UPLOADS_DIR, safeFilename)
    if (fs.existsSync(rootPath)) {
      setSafeHeaders(res, rootPath)
      return res.sendFile(rootPath)
    }

    throw new ApiError(404, 'File not found')
  } catch (error) {
    next(error)
  }
})

module.exports = router
module.exports.authorizeUploadAccess = authorizeUploadAccess
