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
    // Chosen from the validated extension, not the client-supplied MIME type, so a file cannot
    // be steered into a folder with different access rules.
    const ext = path.extname(file.originalname).toLowerCase()
    let subfolder = 'general'
    if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      subfolder = 'photos'
    } else if (['.pdf', '.doc', '.docx'].includes(ext)) {
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

const rawUpload = multer({
  storage,
  fileFilter,
  limits,
})

const rawUploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
})

// Magic-byte signatures: the extension and MIME type are client-controlled, so the stored
// bytes must actually look like the claimed type.
const OLE2 = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
const ZIP = [0x50, 0x4B, 0x03, 0x04]
const SIGNATURES = {
  '.jpg': [[0xFF, 0xD8, 0xFF]],
  '.jpeg': [[0xFF, 0xD8, 0xFF]],
  '.png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46, 0x2D]],
  '.docx': [ZIP],
  '.xlsx': [ZIP],
  '.doc': [OLE2],
  '.xls': [OLE2, ZIP],
}
const startsWith = (buf, sig) => sig.every((b, i) => buf[i] === b)

const contentMatchesExtension = (buf, ext) => {
  if (ext === '.webp') {
    return buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP'
  }
  if (ext === '.txt' || ext === '.csv') return !buf.includes(0) // plain text has no NUL bytes
  const sigs = SIGNATURES[ext]
  return !!sigs && sigs.some((sig) => startsWith(buf, sig))
}

/** Runs after multer: rejects (and deletes) a stored file whose bytes do not match its extension. */
const verifyUploadContent = async (req, res, next) => {
  if (!req.file) return next()
  try {
    const ext = path.extname(req.file.originalname).toLowerCase()
    const handle = await fs.promises.open(req.file.path, 'r')
    let head
    try {
      const buf = Buffer.alloc(8192)
      const { bytesRead } = await handle.read(buf, 0, buf.length, 0)
      head = buf.subarray(0, bytesRead)
    } finally {
      await handle.close()
    }
    if (!contentMatchesExtension(head, ext)) {
      await fs.promises.unlink(req.file.path).catch(() => {})
      return next(new ApiError(400, `File content does not match its '${ext}' extension`))
    }
    next()
  } catch (error) {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {})
    next(error)
  }
}

// Same call shape as multer (upload.single('field')), but returns [multer, content check].
const upload = { single: (field) => [rawUpload.single(field), verifyUploadContent] }
const uploadImage = { single: (field) => [rawUploadImage.single(field), verifyUploadContent] }

module.exports = {
  verifyUploadContent,
  contentMatchesExtension,
  upload,
  uploadImage,
  UPLOADS_DIR,
  fileFilter,
  imageFileFilter,
  ALLOWED_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
}
