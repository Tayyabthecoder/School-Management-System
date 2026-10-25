const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const Student = require('../../models/Student.model')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const Class = require('../../models/Class.model')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const { generateStudentTemplateBuffer, parseStudentExcel } = require('../../utils/excel.util')
const { invalidateCache } = require('../../utils/cache.util')
const { logAudit } = require('../../utils/audit-log.util')
const { ApiError } = require('../../middleware/error.middleware')

const bulkImportStudents = (generateUniqueStudentId) => async (req, res, next) => {
  try {
    const { students: rawList } = req.body
    const created = []
    const errors = []

    const studentRole = await Role.findOne({ name: 'student' })
    const defaultPasswordHash = await bcrypt.hash('Student@1234', BCRYPT_ROUNDS)

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i]
      try {
        const studentId = await generateUniqueStudentId()

        const doc = await Student.create({
          studentId,
          fullName: item.fullName,
          dob: item.dob || new Date('2010-01-01'),
          gender: item.gender || 'Male',
          classId: item.classId,
          sectionId: item.sectionId || 'A',
          guardian: {
            name: item.guardianName || 'Guardian',
            phone: item.guardianPhone || '+923000000000',
          },
        })

        if (studentRole) {
          const username = doc.studentId.toLowerCase()
          const existingUser = await User.findOne({ username })
          if (!existingUser) {
            await User.create({
              username,
              passwordHash: defaultPasswordHash,
              role: studentRole._id,
              roleName: 'student',
              studentId: doc._id,
              mustChangePassword: true,
            })
          }
        }

        created.push(doc)
      } catch (err) {
        errors.push({ row: i + 1, error: err.message })
      }
    }

    if (created.length > 0) {
      await invalidateCache('dashboard:stats')
    }

    res.json({
      success: true,
      data: {
        createdCount: created.length,
        errorCount: errors.length,
        errors,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Download pre-formatted Excel template for importing students
 */
const downloadImportTemplate = async (req, res, next) => {
  try {
    const buffer = await generateStudentTemplateBuffer()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.xlsx"')
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}

/**
 * Upload and parse Excel file to create/update students in bulk
 */
const importStudentsFromExcel = (generateUniqueStudentId) => async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Please upload an Excel spreadsheet (.xlsx, .xls, .csv)')
    }

    const { rows, parseErrors } = await parseStudentExcel(req.file.path)

    if (rows.length === 0 && parseErrors.length === 0) {
      throw new ApiError(400, 'The uploaded Excel file contains no valid student records')
    }

    const created = []
    const updated = []
    const errors = [...parseErrors]

    const studentRole = await Role.findOne({ name: 'student' })
    const defaultPasswordHash = await bcrypt.hash('Student@1234', BCRYPT_ROUNDS)

    // Pre-cache classes to optimize lookups
    const allClasses = await Class.find({ isActive: true })

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i]
      try {
        // Resolve Class
        let targetClass = null
        if (item.className) {
          const trimmedClass = String(item.className).trim()
          // Check by ID if valid ObjectId
          if (mongoose.Types.ObjectId.isValid(trimmedClass)) {
            targetClass = allClasses.find(c => c._id.toString() === trimmedClass)
          }
          // Check by exact name or regex match (e.g. "Grade 10" or "10")
          if (!targetClass) {
            targetClass = allClasses.find(c =>
              c.name.toLowerCase() === trimmedClass.toLowerCase() ||
              c.name.toLowerCase() === `grade ${trimmedClass.toLowerCase()}` ||
              c.name.toLowerCase() === `class ${trimmedClass.toLowerCase()}`
            )
          }
          // Check by level if numeric
          if (!targetClass && !isNaN(parseInt(trimmedClass, 10))) {
            const lvl = parseInt(trimmedClass, 10)
            targetClass = allClasses.find(c => c.level === lvl)
          }
        }

        // Fallback to first available class if not found
        if (!targetClass) {
          targetClass = allClasses[0]
        }

        if (!targetClass) {
          throw new Error('No academic classes configured in the system')
        }

        // Ensure section exists in class
        const targetSection = item.sectionId || 'A'
        if (targetClass.sections && !targetClass.sections.includes(targetSection)) {
          targetClass.sections.push(targetSection)
          await targetClass.save()
        }

        // Check if student exists by studentId or match by (fullName + classId + guardianPhone)
        let existingStudent = null
        if (item.studentId) {
          existingStudent = await Student.findOne({ studentId: item.studentId.trim(), deletedAt: null })
        }
        if (!existingStudent && item.fullName && item.guardian?.phone) {
          existingStudent = await Student.findOne({
            fullName: item.fullName.trim(),
            classId: targetClass._id,
            'guardian.phone': item.guardian.phone.trim(),
            deletedAt: null,
          })
        }

        if (existingStudent) {
          // Update existing student
          existingStudent.fullName = item.fullName || existingStudent.fullName
          if (item.dob) existingStudent.dob = item.dob
          if (item.gender) existingStudent.gender = item.gender
          existingStudent.classId = targetClass._id
          existingStudent.sectionId = targetSection
          if (item.fatherName) existingStudent.fatherName = item.fatherName
          if (item.address) existingStudent.address = item.address
          if (item.city) existingStudent.city = item.city
          if (item.bloodGroup) existingStudent.bloodGroup = item.bloodGroup
          if (item.bFormNumber) existingStudent.bFormNumber = item.bFormNumber
          if (item.nationality) existingStudent.nationality = item.nationality
          if (item.religion) existingStudent.religion = item.religion
          if (item.previousSchool) existingStudent.previousSchool = item.previousSchool
          if (item.medicalNotes) existingStudent.medicalNotes = item.medicalNotes

          if (item.guardian) {
            existingStudent.guardian = {
              name: item.guardian.name || existingStudent.guardian?.name || 'Guardian',
              phone: item.guardian.phone || existingStudent.guardian?.phone || '+923000000000',
              email: item.guardian.email || existingStudent.guardian?.email || '',
              cnic: item.guardian.cnic || existingStudent.guardian?.cnic || '',
              relationship: item.guardian.relationship || existingStudent.guardian?.relationship || 'Parent',
              occupation: existingStudent.guardian?.occupation || '',
            }
          }

          if (item.emergencyContact) {
            existingStudent.emergencyContact = {
              name: item.emergencyContact.name || existingStudent.emergencyContact?.name || '',
              phone: item.emergencyContact.phone || existingStudent.emergencyContact?.phone || '',
              relationship: item.emergencyContact.relationship || existingStudent.emergencyContact?.relationship || 'Guardian',
            }
          }

          await existingStudent.save()
          updated.push(existingStudent)
        } else {
          // Create new student
          const studentId = item.studentId?.trim() || (await generateUniqueStudentId())

          const newDoc = await Student.create({
            studentId,
            fullName: item.fullName.trim(),
            dob: item.dob || new Date('2010-01-01'),
            gender: item.gender || 'Male',
            classId: targetClass._id,
            sectionId: targetSection,
            fatherName: item.fatherName || '',
            guardian: {
              name: item.guardian?.name || item.fatherName || 'Guardian',
              phone: item.guardian?.phone || '+923000000000',
              email: item.guardian?.email || '',
              cnic: item.guardian?.cnic || '',
              relationship: item.guardian?.relationship || 'Parent',
            },
            emergencyContact: item.emergencyContact || {
              name: item.guardian?.name || 'Guardian',
              phone: item.guardian?.phone || '+923000000000',
              relationship: 'Guardian',
            },
            address: item.address || '',
            city: item.city || 'Karachi',
            bloodGroup: item.bloodGroup || '',
            bFormNumber: item.bFormNumber || '',
            nationality: item.nationality || 'Pakistani',
            religion: item.religion || 'Islam',
            previousSchool: item.previousSchool || '',
            medicalNotes: item.medicalNotes || 'None reported / General fitness',
            status: 'Active',
          })

          if (studentRole) {
            const username = newDoc.studentId.toLowerCase()
            const existingUser = await User.findOne({ username })
            if (!existingUser) {
              await User.create({
                username,
                passwordHash: defaultPasswordHash,
                role: studentRole._id,
                roleName: 'student',
                studentId: newDoc._id,
                mustChangePassword: true,
              })
            }
          }

          created.push(newDoc)
        }
      } catch (err) {
        errors.push({ row: item.rowNumber || i + 2, error: err.message })
      }
    }

    if (created.length > 0 || updated.length > 0) {
      await invalidateCache('dashboard:stats')
      await logAudit(req, 'STUDENT_BULK_IMPORTED', {
        createdCount: created.length,
        updatedCount: updated.length,
        totalAttempted: rows.length,
        filename: req.file.originalname,
      })
    }

    res.json({
      success: true,
      message: `Import processed: ${created.length} students added, ${updated.length} updated${errors.length > 0 ? `, ${errors.length} issues` : ''}`,
      data: {
        totalRows: rows.length,
        createdCount: created.length,
        updatedCount: updated.length,
        errorCount: errors.length,
        errors,
      },
    })
  } catch (error) {
    next(error)
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (_) {}
    }
  }
}

module.exports = {
  bulkImportStudents,
  downloadImportTemplate,
  importStudentsFromExcel,
}
