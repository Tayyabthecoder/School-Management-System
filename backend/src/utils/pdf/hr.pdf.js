const { drawHeader, drawFooter } = require('./pdf.base')

const buildPayslipPDF = (doc, data, branding = {}) => {
  const brand = (branding && Object.keys(branding).length > 0) ? branding : (data.branding || {})
  drawHeader(doc, 'Staff Monthly Payslip', `Month/Year: ${data.month}/${data.year}`, brand)

  let y = 125

  doc.rect(40, y, 515, 55).fill('#F9FAFB').strokeColor('#E5E7EB').stroke()
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10)

  doc.text(`Staff Name: `, 50, y + 12).font('Helvetica').text(`${data.staffName} (${data.staffId})`, 130, y + 12)
  doc.font('Helvetica-Bold').text(`Designation: `, 50, y + 30).font('Helvetica').text(data.designation, 130, y + 30)

  doc.font('Helvetica-Bold').text(`Pay Period: `, 320, y + 12).font('Helvetica').text(`${data.month}/${data.year}`, 410, y + 12)
  doc.font('Helvetica-Bold').text(`Generated On: `, 320, y + 30).font('Helvetica').text(new Date().toLocaleDateString('en-GB'), 410, y + 30)

  y += 75

  // Earnings & Deductions Table
  const tableHeight = 145
  doc.rect(40, y, 250, tableHeight).fill('#FFFFFF').strokeColor('#E5E7EB').stroke()
  doc.rect(305, y, 250, tableHeight).fill('#FFFFFF').strokeColor('#E5E7EB').stroke()

  // Table Headers
  const headerColor = brand.primaryColor || '#3730A3'
  doc.rect(40, y, 250, 22).fill(headerColor)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('EARNINGS', 50, y + 6)

  doc.rect(305, y, 250, 22).fill(headerColor)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('DEDUCTIONS', 315, y + 6)

  y += 28
  doc.fillColor('#1F2937').font('Helvetica').fontSize(9)

  doc.text('Basic Salary:', 50, y).text(`PKR ${Number(data.basicPay || 0).toLocaleString()}`, 180, y)
  doc.text('Absent Deductions:', 315, y).text(`PKR ${Number(data.absentDaysDeduction || 0).toLocaleString()}`, 440, y)

  y += 18
  doc.text('Allowances:', 50, y).text(`PKR ${Number(data.allowances || 0).toLocaleString()}`, 180, y)
  doc.text('Income Tax (WHT):', 315, y).text(`PKR ${Number(data.incomeTax || 0).toLocaleString()}`, 440, y)

  y += 18
  doc.text('EOBI (Pension):', 315, y).text(`PKR ${Number(data.eobi || 0).toLocaleString()}`, 440, y)

  y += 18
  doc.text('SESSI / Social Sec:', 315, y).text(`PKR ${Number(data.sessi || 0).toLocaleString()}`, 440, y)

  y += 18
  doc.text('Other Deductions:', 315, y).text(`PKR ${Number(data.otherDeductions || 0).toLocaleString()}`, 440, y)

  y += 35
  // Net Pay Box
  doc.rect(40, y, 515, 35).fill('#EEF2FF').strokeColor('#C7D2FE').stroke()
  doc.fillColor(headerColor).font('Helvetica-Bold').fontSize(11)
  doc.text(`TOTAL NET PAYABLE: PKR ${Number(data.netPay).toLocaleString()}`, 55, y + 11)

  y += 55
  doc.moveTo(355, y).lineTo(505, y).strokeColor('#9CA3AF').stroke()
  doc.fontSize(9).fillColor('#4B5563').text('HR Manager Signature', 355, y + 6)

  drawFooter(doc, 'Payslip')
}

module.exports = {
  buildPayslipPDF,
}
