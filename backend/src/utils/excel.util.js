const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')

/**
 * Sanitize cell values against CSV / Excel Formula Injection (CSV Injection)
 * Prevents formula execution when opened in Excel/LibreOffice if value starts with =, +, -, @, \t, \r
 */
const sanitizeCellValue = (value) => {
  if (typeof value === 'string') {
    if (/^[=+\-@\t\r]/.test(value) || /^[=+\-@]/.test(value.trimStart())) {
      return `'${value}`
    }
  }
  return value
}

const sanitizeRow = (row) => {
  if (Array.isArray(row)) {
    return row.map(sanitizeCellValue)
  }
  if (row && typeof row === 'object') {
    const sanitized = {}
    for (const [key, val] of Object.entries(row)) {
      sanitized[key] = sanitizeCellValue(val)
    }
    return sanitized
  }
  return row
}

/**
 * Standard generic Excel generator used across SMS
 */
const generateExcelBuffer = async (columns, rows, sheetName = 'Report') => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }))

  rows.forEach(row => {
    worksheet.addRow(sanitizeRow(row))
  })

  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

/**
 * Generate a beautifully styled Student Import Template Excel file
 */
const generateStudentTemplateBuffer = async () => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'School Management System'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Students Import Template', {
    views: [{ showGridLines: true }],
  })

  const templateColumns = [
    { header: 'Full Name *', key: 'fullName', width: 25 },
    { header: 'Class / Grade *', key: 'className', width: 18 },
    { header: 'Section', key: 'sectionId', width: 12 },
    { header: 'Gender', key: 'gender', width: 14 },
    { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 26 },
    { header: 'Father Name', key: 'fatherName', width: 22 },
    { header: 'Guardian Name', key: 'guardianName', width: 22 },
    { header: 'Guardian Phone *', key: 'guardianPhone', width: 20 },
    { header: 'Guardian Email', key: 'guardianEmail', width: 26 },
    { header: 'Guardian CNIC', key: 'guardianCnic', width: 20 },
    { header: 'Guardian Relationship', key: 'guardianRelationship', width: 22 },
    { header: 'Address', key: 'address', width: 32 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'Blood Group', key: 'bloodGroup', width: 14 },
    { header: 'B-Form Number', key: 'bFormNumber', width: 20 },
    { header: 'Student ID (For Updates)', key: 'studentId', width: 26 },
  ]

  worksheet.columns = templateColumns

  // Sample rows to demonstrate format
  const sampleRows = [
    {
      fullName: 'Muhammad Ali',
      className: 'Grade 10',
      sectionId: 'A',
      gender: 'Male',
      dob: '2010-03-15',
      fatherName: 'Tariq Mehmood',
      guardianName: 'Tariq Mehmood',
      guardianPhone: '+923001234567',
      guardianEmail: 'tariq.mehmood@example.com',
      guardianCnic: '42101-1234567-1',
      guardianRelationship: 'Father',
      address: 'House 45, Street 8, DHA Phase 5',
      city: 'Karachi',
      bloodGroup: 'B+',
      bFormNumber: '42101-9876543-1',
      studentId: '',
    },
    {
      fullName: 'Ayesha Khan',
      className: 'Grade 9',
      sectionId: 'B',
      gender: 'Female',
      dob: '2011-07-22',
      fatherName: 'Rashid Khan',
      guardianName: 'Saima Rashid',
      guardianPhone: '+923219876543',
      guardianEmail: 'saima.k@example.com',
      guardianCnic: '42201-2345678-2',
      guardianRelationship: 'Mother',
      address: 'Apartment 302, Block 13-D, Gulshan-e-Iqbal',
      city: 'Karachi',
      bloodGroup: 'O+',
      bFormNumber: '42201-8765432-2',
      studentId: '',
    },
    {
      fullName: 'Hamza Farooq',
      className: 'Grade 8',
      sectionId: 'A',
      gender: 'Male',
      dob: '2012-11-05',
      fatherName: 'Farooq Ahmed',
      guardianName: 'Farooq Ahmed',
      guardianPhone: '+923335557788',
      guardianEmail: 'farooq.ahmed@example.com',
      guardianCnic: '42301-3456789-3',
      guardianRelationship: 'Father',
      address: 'Bungalow 12-B, PECHS Block 2',
      city: 'Karachi',
      bloodGroup: 'A+',
      bFormNumber: '42301-7654321-3',
      studentId: '',
    },
  ]

  sampleRows.forEach(row => worksheet.addRow(row))

  // Style header row
  const headerRow = worksheet.getRow(1)
  headerRow.height = 32
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }, // Deep Navy / Indigo
  }

  // Apply cell borders and styling to sample data rows
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: 'middle', horizontal: 'left' }
    if (rowNumber > 1) {
      row.height = 24
      row.font = { name: 'Calibri', size: 10 }
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // light slate zebra
        }
      }
    }
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  // Add notes sheet with helpful instructions
  const instructionsSheet = workbook.addWorksheet('Instructions')
  instructionsSheet.columns = [
    { header: 'Field', key: 'field', width: 25 },
    { header: 'Required?', key: 'required', width: 15 },
    { header: 'Description / Accepted Formats', key: 'desc', width: 65 },
  ]
  instructionsSheet.getRow(1).height = 28
  instructionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  instructionsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF334155' },
  }

  const instructionsData = [
    { field: 'Full Name', required: 'Yes', desc: 'Full legal student name (e.g., Muhammad Ali)' },
    { field: 'Class / Grade', required: 'Yes', desc: 'Grade level or class name (e.g., "Grade 10" or "10")' },
    { field: 'Section', required: 'No', desc: 'Section identifier (e.g., "A", "B"). Defaults to "A"' },
    { field: 'Gender', required: 'No', desc: '"Male", "Female", or "Other". Defaults to "Male"' },
    { field: 'Date of Birth', required: 'No', desc: 'YYYY-MM-DD or standard date format' },
    { field: 'Guardian Phone', required: 'Recommended', desc: 'Primary contact phone number for guardian' },
    { field: 'Student ID', required: 'No (Leave blank)', desc: 'Leave blank to generate a new Student ID. Provide existing Student ID (e.g. STU-2026-00001) to update an existing student.' },
  ]

  instructionsData.forEach(item => instructionsSheet.addRow(item))

  return await workbook.xlsx.writeBuffer()
}

/**
 * Extract clean string / date value from an Excel cell
 */
const extractCellValue = (cell) => {
  if (cell === null || cell === undefined) return ''
  const val = cell.value !== undefined ? cell.value : cell
  if (val === null || val === undefined) return ''

  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }

  if (typeof val === 'object') {
    if (Array.isArray(val.richText)) {
      return val.richText.map(t => t.text || '').join('').trim()
    }
    if (val.text !== undefined) return String(val.text).trim()
    if (val.result !== undefined) return String(val.result).trim()
  }

  return String(val).trim()
}

/**
 * Normalize header names to alphanumeric lowercase for robust column mapping
 */
const normalizeHeader = (header) => {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Parse an Excel file (.xlsx, .xls, .csv) into structured student data records
 */
const parseStudentExcel = async (filePathOrBuffer) => {
  const workbook = new ExcelJS.Workbook()

  if (Buffer.isBuffer(filePathOrBuffer)) {
    await workbook.xlsx.load(filePathOrBuffer)
  } else if (typeof filePathOrBuffer === 'string') {
    const ext = path.extname(filePathOrBuffer).toLowerCase()
    if (ext === '.csv') {
      await workbook.csv.readFile(filePathOrBuffer)
    } else {
      await workbook.xlsx.readFile(filePathOrBuffer)
    }
  } else {
    throw new Error('Invalid file input for Excel parser')
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('The uploaded Excel spreadsheet contains no worksheets')
  }

  // Find header row and map columns
  let headerRowIndex = 1
  const headerMap = {}

  // Find the first row that has text headers
  for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r)
    let textCellCount = 0
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = extractCellValue(cell)
      if (val && typeof val === 'string' && val.length > 0) {
        textCellCount++
      }
    })
    if (textCellCount >= 2) {
      headerRowIndex = r
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const rawHeader = extractCellValue(cell)
        const normalized = normalizeHeader(rawHeader)
        if (normalized) {
          headerMap[colNumber] = normalized
        }
      })
      break
    }
  }

  if (Object.keys(headerMap).length === 0) {
    throw new Error('Unable to find valid header columns in the uploaded Excel file')
  }

  const rows = []
  const parseErrors = []

  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r)
    let hasAnyData = false

    const rawRecord = {}
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const fieldKey = headerMap[colNumber]
      if (fieldKey) {
        const val = extractCellValue(cell)
        if (val !== '') {
          hasAnyData = true
          rawRecord[fieldKey] = val
        }
      }
    })

    if (!hasAnyData) {
      continue // Skip empty row
    }

    // Map normalized keys to student fields
    const getVal = (possibleKeys, defaultVal = '') => {
      for (const k of possibleKeys) {
        const norm = normalizeHeader(k)
        if (rawRecord[norm] !== undefined && rawRecord[norm] !== '') {
          return rawRecord[norm]
        }
      }
      return defaultVal
    }

    const fullName = getVal(['Full Name', 'fullName', 'Student Name', 'Name'])
    if (!fullName || fullName.length < 2) {
      parseErrors.push({
        row: r,
        error: 'Missing or invalid student "Full Name" (minimum 2 characters)',
      })
      continue
    }

    const className = getVal(['Class / Grade', 'Class', 'Grade', 'className', 'Class Name', 'Level', 'classId'])
    const sectionId = getVal(['Section', 'sectionId', 'Sec'], 'A').toUpperCase()
    const studentId = getVal(['Student ID', 'studentId', 'Roll Number', 'Roll No', 'RollNumber', 'ID'])
    const rawGender = getVal(['Gender', 'Sex'], 'Male')
    const gender = ['Female', 'Other'].includes(rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase())
      ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
      : 'Male'

    const rawDob = getVal(['Date of Birth (YYYY-MM-DD)', 'Date of Birth', 'DOB', 'Birth Date', 'dob'])
    let dob = new Date('2010-01-01')
    if (rawDob) {
      const parsedDate = new Date(rawDob)
      if (!isNaN(parsedDate.getTime())) {
        dob = parsedDate
      }
    }

    const fatherName = getVal(['Father Name', 'fatherName', 'Father'])
    const guardianName = getVal(['Guardian Name', 'guardianName', 'Parent Name', 'Guardian'], fatherName || 'Guardian')
    const guardianPhone = getVal(['Guardian Phone', 'guardianPhone', 'Phone', 'Contact', 'Mobile'], '+923000000000')
    const guardianEmail = getVal(['Guardian Email', 'guardianEmail', 'Email'])
    const guardianCnic = getVal(['Guardian CNIC', 'guardianCnic', 'CNIC', 'Father CNIC'])
    const guardianRelationship = getVal(['Guardian Relationship', 'guardianRelationship', 'Relationship'], fatherName ? 'Father' : 'Parent')
    const address = getVal(['Address', 'address', 'Home Address', 'Residential Address'])
    const city = getVal(['City', 'city'], 'Karachi')
    const bloodGroup = getVal(['Blood Group', 'bloodGroup', 'Blood'])
    const bFormNumber = getVal(['B-Form Number', 'bFormNumber', 'B-Form', 'BForm'])
    const nationality = getVal(['Nationality', 'nationality'], 'Pakistani')
    const religion = getVal(['Religion', 'religion'], 'Islam')
    const previousSchool = getVal(['Previous School', 'previousSchool'])
    const medicalNotes = getVal(['Medical Notes', 'medicalNotes'], 'None reported / General fitness')
    const emergencyName = getVal(['Emergency Contact Name', 'Emergency Name', 'emergencyName'])
    const emergencyPhone = getVal(['Emergency Contact Phone', 'Emergency Phone', 'emergencyPhone'])

    rows.push({
      rowNumber: r,
      fullName,
      className,
      sectionId,
      studentId,
      gender,
      dob,
      fatherName,
      guardian: {
        name: guardianName,
        phone: guardianPhone,
        email: guardianEmail,
        cnic: guardianCnic,
        relationship: guardianRelationship,
      },
      address,
      city,
      bloodGroup,
      bFormNumber,
      nationality,
      religion,
      previousSchool,
      medicalNotes,
      emergencyContact: {
        name: emergencyName || guardianName,
        phone: emergencyPhone || guardianPhone,
        relationship: guardianRelationship || 'Guardian',
      },
    })
  }

  return {
    rows,
    parseErrors,
    totalRows: rows.length + parseErrors.length,
  }
}

module.exports = {
  generateExcelBuffer,
  generateStudentTemplateBuffer,
  parseStudentExcel,
  sanitizeCellValue,
}
