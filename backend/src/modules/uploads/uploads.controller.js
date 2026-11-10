const path = require('path')
const fs = require('fs')
const Student = require('../../models/Student.model')
const { ApiError } = require('../../middleware/error.middleware')
const { UPLOADS_DIR } = require('../../middleware/upload.middleware')

/**
 * Builds the authenticated serving URL (/uploads/<subfolder>/<file>) for a stored file.
 * Computed relative to the configured UPLOADS_DIR so it stays correct when UPLOAD_DIR
 * points outside the backend folder (e.g. a mounted Docker volume).
 */
const buildFileUrl = (filePath) => {
  const relativePath = path.relative(UPLOADS_DIR, filePath).split(path.sep).join('/')
  return `/uploads/${relativePath}`
}

/** Removes a file multer already wrote to disk when the request ultimately fails. */
const discardUploadedFile = (file) => {
  if (!file?.path) return
  fs.promises.unlink(file.path).catch(() => {})
}

/**
 * Handle single generic file upload
 */
const uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file was uploaded')
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl: buildFileUrl(req.file.path),
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Upload and attach document to student
 */
const uploadStudentDocument = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const documentName = req.body.name || req.file?.originalname || 'Document'

    if (!req.file) {
      throw new ApiError(400, 'No document was uploaded')
    }

    const student = await Student.findOne({ _id: studentId, deletedAt: null })
    if (!student) {
      throw new ApiError(404, 'Student not found')
    }

    student.documents.push({
      name: documentName,
      url: buildFileUrl(req.file.path),
      uploadedAt: new Date(),
    })
    await student.save()

    res.status(201).json({
      success: true,
      message: 'Student document attached successfully',
      data: student.documents,
    })
  } catch (error) {
    discardUploadedFile(req.file)
    next(error)
  }
}

/**
 * Upload and update student profile photo
 */
const uploadStudentPhoto = async (req, res, next) => {
  try {
    const { studentId } = req.params

    if (!req.file) {
      throw new ApiError(400, 'No image was uploaded')
    }

    const student = await Student.findOneAndUpdate(
      { _id: studentId, deletedAt: null },
      { photoUrl: buildFileUrl(req.file.path) },
      { new: true }
    )

    if (!student) {
      throw new ApiError(404, 'Student not found')
    }

    res.json({
      success: true,
      message: 'Student photo updated successfully',
      data: { photoUrl: student.photoUrl },
    })
  } catch (error) {
    discardUploadedFile(req.file)
    next(error)
  }
}

module.exports = {
  uploadSingleFile,
  uploadStudentDocument,
  uploadStudentPhoto,
  buildFileUrl,
}
