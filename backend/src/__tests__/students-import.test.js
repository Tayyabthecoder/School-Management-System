const { generateStudentTemplateBuffer, parseStudentExcel } = require('../utils/excel.util')
const studentsController = require('../modules/students/students.controller')
const Student = require('../models/Student.model')
const Class = require('../models/Class.model')
const User = require('../models/User.model')
const Role = require('../models/Role.model')
const Counter = require('../models/Counter.model')
const auditLogUtil = require('../utils/audit-log.util')
const ExcelJS = require('exceljs')

jest.mock('../models/Student.model')
jest.mock('../models/Class.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/Counter.model')
jest.mock('../utils/audit-log.util')
jest.mock('../utils/cache.util', () => ({
  invalidateCache: jest.fn().mockResolvedValue(),
}))

describe('Student Import System Tests', () => {
  describe('Excel Utilities for Student Import', () => {
    it('generates a valid student template Excel buffer with instructions and sample rows', async () => {
      const buffer = await generateStudentTemplateBuffer()
      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer.length).toBeGreaterThan(1000)

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      expect(workbook.worksheets.length).toBe(2)
      expect(workbook.worksheets[0].name).toBe('Students Import Template')
      expect(workbook.worksheets[1].name).toBe('Instructions')

      const sheet = workbook.worksheets[0]
      const headerRow = sheet.getRow(1)
      expect(headerRow.getCell(1).value).toBe('Full Name *')
      expect(headerRow.getCell(2).value).toBe('Class / Grade *')
      expect(sheet.rowCount).toBeGreaterThanOrEqual(4) // 1 header + 3 sample rows
    })

    it('parses an in-memory Excel workbook buffer accurately into student objects', async () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Students')
      sheet.addRow(['Full Name', 'Class / Grade', 'Section', 'Gender', 'Guardian Phone', 'Father Name'])
      sheet.addRow(['Bilal Ahmed', 'Grade 10', 'B', 'Male', '+923001122334', 'Ahmed Raza'])
      sheet.addRow(['Zainab Bibi', 'Grade 8', 'A', 'Female', '+923214455667', 'Bibi Noor'])

      const testBuffer = await workbook.xlsx.writeBuffer()
      const { rows, parseErrors } = await parseStudentExcel(testBuffer)

      expect(parseErrors).toHaveLength(0)
      expect(rows).toHaveLength(2)

      expect(rows[0].fullName).toBe('Bilal Ahmed')
      expect(rows[0].className).toBe('Grade 10')
      expect(rows[0].sectionId).toBe('B')
      expect(rows[0].gender).toBe('Male')
      expect(rows[0].guardian.phone).toBe('+923001122334')
      expect(rows[0].fatherName).toBe('Ahmed Raza')

      expect(rows[1].fullName).toBe('Zainab Bibi')
      expect(rows[1].className).toBe('Grade 8')
      expect(rows[1].gender).toBe('Female')
    })

    it('collects parse errors for rows missing full name', async () => {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Students')
      sheet.addRow(['Full Name', 'Class / Grade', 'Section'])
      sheet.addRow(['', 'Grade 10', 'A']) // Missing name
      sheet.addRow(['Sara Malik', 'Grade 7', 'C'])

      const testBuffer = await workbook.xlsx.writeBuffer()
      const { rows, parseErrors } = await parseStudentExcel(testBuffer)

      expect(rows).toHaveLength(1)
      expect(rows[0].fullName).toBe('Sara Malik')
      expect(parseErrors).toHaveLength(1)
      expect(parseErrors[0].row).toBe(2)
      expect(parseErrors[0].error).toContain('Missing or invalid student "Full Name"')
    })
  })

  describe('Student Controller Import Endpoints', () => {
    let req, res, next

    beforeEach(() => {
      jest.clearAllMocks()
      res = {
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
      auditLogUtil.logAudit.mockResolvedValue()
    })

    it('downloadImportTemplate generates and returns Excel spreadsheet file stream', async () => {
      req = { user: { roleName: 'super_admin' } }
      await studentsController.downloadImportTemplate(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="student_import_template.xlsx"'
      )
      expect(res.send).toHaveBeenCalled()
    })

    it('importStudentsFromExcel throws 400 when no file is uploaded', async () => {
      req = { file: null }
      await studentsController.importStudentsFromExcel(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Please upload an Excel spreadsheet'),
        })
      )
    })
  })
})
