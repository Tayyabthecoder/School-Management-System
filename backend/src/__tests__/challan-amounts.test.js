const { buildChallanAmountRows, buildFeeChallanPDF, DEFAULT_CHALLAN_SETTINGS } = require('../utils/pdf/finance.pdf')
const { generatePDFBuffer } = require('../utils/pdf/pdf.base')

const rowAmount = (rows, title) => rows.find((r) => r.title.startsWith(title))?.amount

const baseFee = {
  feeTitle: 'Grade 5 Tuition',
  amountDue: 10000,
  discount: 0,
  concessionType: 'None',
  netAmount: 10000,
}

describe('challan amount rows', () => {
  test('after a partial payment the payable amount is the remaining balance', () => {
    const { lineItems, balance } = buildChallanAmountRows(
      { ...baseFee, amountPaid: 4000, outstandingAmount: 6000 },
      { lateFeeSurcharge: 500 }
    )

    expect(balance).toBe(6000)
    expect(rowAmount(lineItems, 'Less: Already Paid')).toBe(`- ${(4000).toLocaleString()}`)
    expect(rowAmount(lineItems, 'NET PAYABLE')).toBe((6000).toLocaleString())
    expect(rowAmount(lineItems, 'GROSS AMOUNT')).toBe((6500).toLocaleString())
  })

  test('an unpaid challan shows the full net amount and no "already paid" row', () => {
    const { lineItems } = buildChallanAmountRows({ ...baseFee, amountPaid: 0, outstandingAmount: 10000 }, { lateFeeSurcharge: 500 })

    expect(rowAmount(lineItems, 'Less: Already Paid')).toBeUndefined()
    expect(rowAmount(lineItems, 'NET PAYABLE')).toBe((10000).toLocaleString())
  })

  test('a settled challan carries no late surcharge', () => {
    const { lineItems, surcharge } = buildChallanAmountRows(
      { ...baseFee, amountPaid: 10000, outstandingAmount: 0 },
      { lateFeeSurcharge: 500 }
    )

    expect(surcharge).toBe(0)
    expect(rowAmount(lineItems, 'GROSS AMOUNT')).toBe('0')
  })

  test('a partially paid challan still renders on a single page', async () => {
    const buffer = await generatePDFBuffer((doc) => {
      buildFeeChallanPDF(doc, {
        ...baseFee,
        amountPaid: 4000,
        outstandingAmount: 6000,
        challanNo: 'CHL-2026-ABC123',
        issueDate: '01/05/2026',
        dueDate: '11/05/2026',
        monthYear: 'May 2026',
        studentName: 'Sara Khan',
        studentId: 'STU-2026-0001',
        className: 'Grade 5',
        sectionId: 'A',
        guardianName: 'Imran Khan',
        status: 'Partial',
      }, DEFAULT_CHALLAN_SETTINGS)
    }, { size: 'A4', layout: 'landscape', margin: 15 })

    const pageCount = (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
    expect(pageCount).toBe(1)
  })
})
