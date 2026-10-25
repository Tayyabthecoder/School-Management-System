const { generatePDFBuffer, buildReportCardPDF, buildFeeChallanPDF } = require('../utils/pdf.util')
const { getPagination, formatPaginatedResponse } = require('../utils/pagination.util')

describe('Utility Unit Tests', () => {
  describe('Pagination Utility', () => {
    it('should return correct page, limit, and skip values', () => {
      const { page, limit, skip } = getPagination({ page: '2', limit: '10' })
      expect(page).toBe(2)
      expect(limit).toBe(10)
      expect(skip).toBe(10)
    })

    it('should fallback to default page=1 and limit=25', () => {
      const { page, limit, skip } = getPagination({})
      expect(page).toBe(1)
      expect(limit).toBe(25)
      expect(skip).toBe(0)
    })

    it('should format paginated response correctly', () => {
      const res = formatPaginatedResponse([{ id: 1 }], 50, 1, 25)
      expect(res.success).toBe(true)
      expect(res.meta.totalPages).toBe(2)
      expect(res.meta.total).toBe(50)
    })
  })

  describe('PDF Generator Utility', () => {
    it('should generate a valid PDF Buffer for Report Card', async () => {
      const pdfBuffer = await generatePDFBuffer((doc) => {
        buildReportCardPDF(doc, {
          studentName: 'Test Student',
          studentId: 'STU-001',
          className: 'Grade 10',
          sectionId: 'A',
          termName: 'Term 1',
          grades: [{ subjectName: 'Math', marksObtained: 90, maxMarks: 100, percentage: 90, gradeLetter: 'A+' }],
        })
      })

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(100)
    })

    it('should generate a valid 3-part Fee Challan PDF Buffer with multi-channel payment details', async () => {
      const pdfBuffer = await generatePDFBuffer(
        (doc) => {
          buildFeeChallanPDF(
            doc,
            {
              challanNo: 'CHL-2026-TEST01',
              issueDate: '01/09/2026',
              dueDate: '10/09/2026',
              monthYear: 'September 2026',
              studentName: 'Ali Khan',
              studentId: 'STU-2026-001',
              className: 'Grade 10',
              sectionId: 'A',
              guardianName: 'Tariq Khan',
              feeTitle: 'Grade 10 Monthly Tuition Fee',
              amountDue: 8000,
              discount: 2000,
              concessionType: 'Sibling Discount',
              netAmount: 6000,
              outstandingAmount: 6000,
              status: 'Pending',
            },
            {
              layout: '3-part',
              instituteName: 'AL-HAQ MODEL ACADEMY',
              paymentMethods: [
                { type: 'bank', name: 'Meezan Bank Ltd', accountNumber: '0142-79012345-03', accountTitle: 'Fee Collection', isEnabled: true },
                { type: 'easypaisa', name: 'Easypaisa', accountNumber: 'Till: 789012', isEnabled: true },
                { type: 'jazzcash', name: 'JazzCash', accountNumber: 'Till: 654321', isEnabled: true },
              ],
            }
          )
        },
        { size: 'A4', layout: 'landscape', margin: 15 }
      )

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(500)
    })

    it('should generate a valid 2-part Fee Challan PDF Buffer (Office Copy, Student Copy)', async () => {
      const pdfBuffer = await generatePDFBuffer(
        (doc) => {
          buildFeeChallanPDF(
            doc,
            {
              challanNo: 'CHL-2026-TEST03',
              issueDate: '01/09/2026',
              dueDate: '10/09/2026',
              monthYear: 'September 2026',
              studentName: 'Hassan Raza',
              studentId: 'STU-2026-105',
              className: 'Grade 6',
              sectionId: 'A',
              guardianName: 'Raza Farooqi',
              feeTitle: 'Monthly Tuition Fee',
              amountDue: 11000,
              discount: 0,
              concessionType: 'None',
              netAmount: 11000,
              outstandingAmount: 11000,
              status: 'Pending',
            },
            {
              layout: '2-part',
              instituteName: 'AL-HAQ MODEL ACADEMY',
              copies: [
                { name: 'Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#1E3A8A' },
                { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#065F46' },
              ],
            }
          )
        },
        { size: 'A4', layout: 'landscape', margin: 15 }
      )

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(500)
    })
  })
})


