const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const env = require('../config/env')
const { ApiError } = require('./error.middleware')

// Root uploads directory
const UPLOADS_DIR = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(__dirname, '../../', env.UPLOAD_DIR)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// Storage configuration with subfolder support
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'general'
    if (file.mimetype.startsWith('image/')) {
      subfolder = 'photos'
    } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('document')) {
      subfolder = 'documents'
    }

    const destDir = path.join(UPLOADS_DIR, subfolder)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    cb(null, destDir)
  },
  filename: (req, file, cb) => {
    // Generate secure random filename preserving sanitized extension
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueId = crypto.randomUUID()
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    cb(null, `${sanitizedBase}-${uniqueId}${ext}`)
  },
})

// Allowed MIME types (GIF removed to prevent embedded script exploits in legacy renderers)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
])

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.docx', '.doc',
  '.xlsx', '.xls', '.csv', '.txt',
])

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
])

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new ApiError(400, `File extension '${ext}' is not permitted`), false)
  }
  const isExcelDoc = ['.xlsx', '.xls', '.csv'].includes(ext)
  if (ALLOWED_MIME_TYPES.has(file.mimetype) || isExcelDoc) {
    cb(null, true)
  } else {
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX, CSV`), false)
  }
}

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return cb(new ApiError(400, `Image extension '${ext}' is not permitted`), false)
  }
  if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, `Only JPG, PNG, or WebP image files are allowed. Received: ${file.mimetype}`), false)
  }
}

// File size limit from config
const limits = {
  fileSize: (env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
}

const upload = multer({
  storage,
  fileFilter,
  limits,
})

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
})

module.exports = {
  upload,
  uploadImage,
  UPLOADS_DIR,
  fileFilter,
  imageFileFilter,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
}
