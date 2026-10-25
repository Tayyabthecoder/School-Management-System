const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const { UPLOADS_DIR } = require('../../middleware/upload.middleware')
const { ApiError } = require('../../middleware/error.middleware')

const ALLOWED_SUBFOLDERS = new Set(['photos', 'documents', 'general'])

/**
 * Authenticated and sanitized file serving endpoint
 * GET /api/v1/uploads/file/:subfolder/:filename or /uploads/:subfolder/:filename
 */
router.get('/:subfolder/:filename', (req, res, next) => {
  try {
    const { subfolder, filename } = req.params

    if (!ALLOWED_SUBFOLDERS.has(subfolder)) {
      throw new ApiError(404, 'Invalid uploads category')
    }

    // path.basename strictly prevents directory traversal attacks
    const safeFilename = path.basename(filename)
    const filePath = path.join(UPLOADS_DIR, subfolder, safeFilename)

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, 'File not found')
    }

    // Set secure response headers for served files
    res.setHeader('X-Content-Type-Options', 'nosniff')
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
router.get('/:filename', (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.filename)
    
    // Check subfolders first
    for (const subfolder of ALLOWED_SUBFOLDERS) {
      const candidatePath = path.join(UPLOADS_DIR, subfolder, safeFilename)
      if (fs.existsSync(candidatePath)) {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        return res.sendFile(candidatePath)
      }
    }

    const rootPath = path.join(UPLOADS_DIR, safeFilename)
    if (fs.existsSync(rootPath)) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.sendFile(rootPath)
    }

    throw new ApiError(404, 'File not found')
  } catch (error) {
    next(error)
  }
})

module.exports = router
