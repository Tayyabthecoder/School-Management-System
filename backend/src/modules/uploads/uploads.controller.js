const path = require('path')
const Student = require('../../models/Student.model')
const Staff = require('../../models/Staff.model')
const { ApiError } = require('../../middleware/error.middleware')

/**
 * Handle single generic file upload
 */
const uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file was uploaded')
    }

    // Determine public URL relative to uploads directory
    const relativePath = path.relative(path.join(__dirname, '../../../backend'), req.file.path).replace(/\\/g, '/')
    const fileUrl = `/${relativePath}`

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl,
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

    const relativePath = path.relative(path.join(__dirname, '../../../backend'), req.file.path).replace(/\\/g, '/')
    const fileUrl = `/${relativePath}`

    student.documents.push({
      name: documentName,
      url: fileUrl,
      uploadedAt: new Date(),
    })
    await student.save()

    res.status(201).json({
      success: true,
      message: 'Student document attached successfully',
      data: student.documents,
    })
  } catch (error) {
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

    const relativePath = path.relative(path.join(__dirname, '../../../backend'), req.file.path).replace(/\\/g, '/')
    const photoUrl = `/${relativePath}`

    const student = await Student.findOneAndUpdate(
      { _id: studentId, deletedAt: null },
      { photoUrl },
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
    next(error)
  }
}

module.exports = {
  uploadSingleFile,
  uploadStudentDocument,
  uploadStudentPhoto,
}
