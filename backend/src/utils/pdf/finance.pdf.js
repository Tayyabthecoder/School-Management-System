const { drawHeader, drawFooter } = require('./pdf.base')

const buildPaymentReceiptPDF = (doc, data, branding = {}) => {
  const brand = (branding && Object.keys(branding).length > 0) ? branding : (data.branding || {})
  drawHeader(doc, 'Official Fee Payment Receipt', `Receipt #: ${data.receiptNo}`, brand)

  let y = 125

  doc.rect(40, y, 515, 160).fill('#F9FAFB').strokeColor('#E5E7EB').stroke()
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10)

  doc.text(`Receipt Number: `, 50, y + 15).font('Helvetica').text(data.receiptNo, 160, y + 15)
  doc.font('Helvetica-Bold').text(`Payment Date: `, 50, y + 35).font('Helvetica').text(new Date(data.paymentDate).toLocaleDateString('en-GB'), 160, y + 35)
  doc.font('Helvetica-Bold').text(`Student Name: `, 50, y + 55).font('Helvetica').text(`${data.studentName} (${data.studentId})`, 160, y + 55)
  doc.font('Helvetica-Bold').text(`Class: `, 50, y + 75).font('Helvetica').text(data.className, 160, y + 75)

  doc.font('Helvetica-Bold').text(`Payment Mode: `, 320, y + 15).font('Helvetica').text(data.paymentMode, 420, y + 15)
  doc.font('Helvetica-Bold').text(`Status: `, 320, y + 35).font('Helvetica').text(data.outstandingAmount <= 0 ? 'CLEARED (PAID)' : 'PARTIAL', 420, y + 35)

  // Paid Banner
  doc.rect(50, y + 105, 495, 40).fill('#ECFDF5').strokeColor('#A7F3D0').stroke()
  doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(12)
  doc.text(`AMOUNT PAID: PKR ${Number(data.amountPaid).toLocaleString()}`, 65, y + 118)

  doc.fillColor('#1F2937').font('Helvetica').fontSize(9)
  doc.text(`Remaining Dues: PKR ${Number(data.outstandingAmount).toLocaleString()}`, 350, y + 118)

  y += 200
  doc.moveTo(355, y).lineTo(505, y).strokeColor('#9CA3AF').stroke()
  doc.fontSize(9).fillColor('#4B5563').text('Accounts Officer Signature', 355, y + 6)

  drawFooter(doc, 'Fee Receipt')
}

/**
 * Dynamic Multi-Channel Fee Challan PDF Generator
 * Supports: 2-Part and 3-Part layouts, Custom Copy Names, Bank + Easypaisa + JazzCash + Raast Payment Channels, Fee Particulars Table, and Custom Instructions.
 */
const DEFAULT_CHALLAN_SETTINGS = {
  layout: '3-part',
  instituteName: 'SCHOOL MANAGEMENT SYSTEM',
  subHeader: 'BANK & DIGITAL PAYMENT FEE CHALLAN - ACADEMIC 2026',
  copies: [
    { name: 'Outer Office Copy', subtitle: '(Bank / External Clearing Copy)', badgeColor: '#1E3A8A' },
    { name: 'Inner Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#065F46' },
    { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#581C87' },
  ],
  paymentMethods: [
    {
      type: 'bank',
      name: 'Habib Bank Limited (HBL) / Meezan Bank',
      accountTitle: 'SMS Educational Trust Fee Collection',
      accountNumber: '0142-79012345-03',
      branchCode: '0142',
      isEnabled: true,
      isPrimary: true,
    },
    {
      type: 'easypaisa',
      name: 'Easypaisa Merchant',
      accountTitle: 'SMS School Fee A/C',
      accountNumber: 'Till ID: 789012 (or 0300-1234567)',
      isEnabled: true,
      isPrimary: false,
    },
    {
      type: 'jazzcash',
      name: 'JazzCash Direct',
      accountTitle: 'SMS School Fee A/C',
      accountNumber: 'Till ID: 654321',
      isEnabled: true,
      isPrimary: false,
    },
  ],
  particulars: [
    { id: 'part-1', name: 'Monthly Tuition Fee', type: 'tuition', defaultAmount: 8000, isEnabled: true, isDeduction: false },
    { id: 'part-2', name: 'Examination & Assessment Fee', type: 'fixed', defaultAmount: 500, isEnabled: true, isDeduction: false },
    { id: 'part-3', name: 'Library & Computer Lab Charges', type: 'fixed', defaultAmount: 300, isEnabled: true, isDeduction: false },
    { id: 'part-4', name: 'Sports & Student Development', type: 'fixed', defaultAmount: 200, isEnabled: false, isDeduction: false },
  ],
  lateFeeSurcharge: 500,
  instructions: [
    '1. Fee can be deposited at any online branch of designated banks.',
    '2. Pay via Easypaisa / JazzCash / Banking Apps using student ID / Till ID.',
    '3. Late fee surcharge applies strictly after the due date.',
    '4. Fees once deposited are non-refundable and non-transferable.',
  ],
  signatories: {
    leftTitle: 'Depositor / Student Sign',
    rightTitle: 'Bank / Cashier Stamp',
    middleTitle: 'Accounts Officer',
  },
}

const drawChallanSinglePanel = (doc, { startX, width, copyTitle, copySubtitle, badgeColor, data, settings }) => {
  const panelHeight = 565
  const topY = 15
  const isCompact = width < 220

  // Outer border box
  doc.rect(startX, topY, width, panelHeight).strokeColor('#CBD5E1').lineWidth(0.8).stroke()

  // Top School Header
  doc.rect(startX, topY, width, isCompact ? 32 : 36).fill(badgeColor)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(isCompact ? 8 : 9.5)
  doc.text(settings.instituteName || 'SCHOOL MANAGEMENT SYSTEM', startX, topY + (isCompact ? 5 : 6), {
    align: 'center',
    width,
  })
  doc.font('Helvetica').fontSize(isCompact ? 5.8 : 7)
  doc.text(settings.subHeader || 'BANK & DIGITAL FEE CHALLAN - 2026', startX, topY + (isCompact ? 18 : 20), {
    align: 'center',
    width,
  })

  // Copy Identifier Banner
  const bannerY = topY + (isCompact ? 36 : 41)
  const bannerH = isCompact ? 19 : 22
  doc.rect(startX + 6, bannerY, width - 12, bannerH).fill('#F8FAFC').strokeColor('#E2E8F0').stroke()
  doc.fillColor(badgeColor).font('Helvetica-Bold').fontSize(isCompact ? 7.5 : 8.5)
  doc.text(copyTitle.toUpperCase(), startX + 6, bannerY + 3, { align: 'center', width: width - 12 })
  if (copySubtitle) {
    doc.fillColor('#64748B').font('Helvetica').fontSize(isCompact ? 5.5 : 6.5)
    doc.text(copySubtitle, startX + 6, bannerY + (isCompact ? 11 : 12), { align: 'center', width: width - 12 })
  }

  // Multi-Channel Payment Info Box (Bank + Digital Wallets)
  let y = bannerY + bannerH + 4
  const activePayments = Array.isArray(settings.paymentMethods)
    ? settings.paymentMethods.filter((p) => p && p.isEnabled)
    : DEFAULT_CHALLAN_SETTINGS.paymentMethods
  const paymentBoxHeight = isCompact ? 38 : 36

  doc.rect(startX + 6, y, width - 12, paymentBoxHeight).fill('#F1F5F9').strokeColor('#E2E8F0').stroke()

  if (activePayments.length === 0) {
    doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(isCompact ? 5.5 : 6.2)
    doc.text('No payment channels configured', startX + 9, y + (isCompact ? 14 : 14), { width: width - 18, align: 'center', ellipsis: true })
  } else {
    const bankMethod = activePayments.find((p) => p.type === 'bank') || activePayments[0]
    const digitalMethods = activePayments.filter((p) => p.type !== 'bank')

    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(isCompact ? 6 : 6.8)
    const bankLine = bankMethod ? `${bankMethod.name}` : 'Bank Account'
    doc.text(bankLine, startX + 9, y + 4, { width: width - 18, ellipsis: true })

    doc.font('Helvetica').fontSize(isCompact ? 5.5 : 6.2).fillColor('#334155')
    if (bankMethod) {
      doc.text(`A/C: ${bankMethod.accountNumber} (${bankMethod.accountTitle || 'Fee A/C'})`, startX + 9, y + (isCompact ? 13 : 14), { width: width - 18, ellipsis: true })
    }

    if (digitalMethods.length > 0) {
      const digitalText = digitalMethods.map((d) => `${d.name}: ${d.accountNumber}`).join(' | ')
      doc.font('Helvetica-Bold').fillColor('#047857').fontSize(isCompact ? 5.2 : 5.8)
      doc.text(`⚡ Digital: ${digitalText}`, startX + 9, y + (isCompact ? 24 : 24), { width: width - 18, ellipsis: true })
    }
  }

  // Challan Metadata & Due Date Box
  y += paymentBoxHeight + 4
  const metaH = isCompact ? 28 : 32
  doc.rect(startX + 6, y, width - 12, metaH).fill('#FFFFFF').strokeColor('#E2E8F0').stroke()
  doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(isCompact ? 6 : 6.8)

  const leftColX = startX + 9
  const rightColX = isCompact ? startX + (width / 2) : width > 300 ? startX + Math.round(width * 0.5) : startX + 135

  doc.text('Challan #:', leftColX, y + 4)
  doc.font('Helvetica').text(data.challanNo, leftColX + (isCompact ? 38 : 48), y + 4)

  doc.font('Helvetica-Bold').text('Issue Date:', rightColX, y + 4)
  doc.font('Helvetica').text(data.issueDate, rightColX + (isCompact ? 38 : 45), y + 4)

  doc.font('Helvetica-Bold').fillColor('#DC2626').text('Due Date:', leftColX, y + (isCompact ? 14 : 17))
  doc.font('Helvetica-Bold').fillColor('#DC2626').text(data.dueDate, leftColX + (isCompact ? 38 : 48), y + (isCompact ? 14 : 17))

  doc.font('Helvetica-Bold').fillColor('#1E293B').text('Month:', rightColX, y + (isCompact ? 14 : 17))
  doc.font('Helvetica').text(data.monthYear || 'Sep 2026', rightColX + (isCompact ? 38 : 45), y + (isCompact ? 14 : 17))

  // Student Demographics Box
  y += metaH + 4
  const studentH = isCompact ? 42 : 46
  doc.rect(startX + 6, y, width - 12, studentH).fill('#F8FAFC').strokeColor('#E2E8F0').stroke()
  doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(isCompact ? 6 : 6.8)

  doc.text('Student:', leftColX, y + 4)
  doc.font('Helvetica').text(data.studentName, leftColX + (isCompact ? 40 : 55), y + 4, { width: width - (isCompact ? 50 : 68), ellipsis: true })

  doc.font('Helvetica-Bold').text('Reg / ID:', leftColX, y + (isCompact ? 13 : 14))
  doc.font('Helvetica').text(data.studentId, leftColX + (isCompact ? 40 : 55), y + (isCompact ? 13 : 14))

  doc.font('Helvetica-Bold').text('Class & Sec:', leftColX, y + (isCompact ? 22 : 24))
  doc.font('Helvetica').text(`${data.className} - ${data.sectionId || 'A'}`, leftColX + (isCompact ? 40 : 55), y + (isCompact ? 22 : 24))

  doc.font('Helvetica-Bold').text('Guardian:', leftColX, y + (isCompact ? 31 : 34))
  doc.font('Helvetica').text(data.guardianName || 'Guardian of Student', leftColX + (isCompact ? 40 : 55), y + (isCompact ? 31 : 34), { width: width - (isCompact ? 50 : 68), ellipsis: true })

  // Fee Line-Items Table
  y += studentH + 5
  const tableH = isCompact ? 14 : 16
  doc.rect(startX + 6, y, width - 12, tableH).fill(badgeColor)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(isCompact ? 6 : 6.8)
  doc.text('PARTICULAR / HEAD', leftColX, y + 4)
  doc.text('AMOUNT (PKR)', startX + width - (isCompact ? 55 : 70), y + 4, { align: 'right', width: isCompact ? 48 : 62 })

  y += tableH
  const surcharge = settings.lateFeeSurcharge !== undefined ? settings.lateFeeSurcharge : 500

  const lineItems = [
    { title: data.feeTitle || 'Monthly Tuition Fee', amount: data.amountDue, bold: false, color: '#1E293B', bg: '#FFFFFF' },
    {
      title: `Concession: ${data.concessionType !== 'None' ? data.concessionType : 'Institutional Aid'}`,
      amount: data.discount > 0 ? `- ${Number(data.discount).toLocaleString()}` : '0',
      bold: false,
      color: data.discount > 0 ? '#16A34A' : '#64748B',
      bg: '#F8FAFC',
    },
    { title: 'NET PAYABLE (Within Due Date)', amount: Number(data.netAmount).toLocaleString(), bold: true, color: '#1E3A8A', bg: '#EEF2FF' },
    { title: 'Late Surcharge (After Due Date)', amount: String(surcharge), bold: false, color: '#DC2626', bg: '#FFFFFF' },
    { title: 'GROSS AMOUNT (After Due Date)', amount: Number(data.netAmount + surcharge).toLocaleString(), bold: true, color: '#991B1B', bg: '#FEF2F2' },
  ]

  const rowHeight = isCompact ? 15 : 17
  lineItems.forEach((item) => {
    doc.rect(startX + 6, y, width - 12, rowHeight).fill(item.bg).strokeColor('#E2E8F0').stroke()
    doc.fillColor(item.color).font(item.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(isCompact ? 5.8 : 6.6)
    doc.text(item.title, leftColX, y + 4, { width: width - (isCompact ? 60 : 75), ellipsis: true })
    doc.text(typeof item.amount === 'number' ? Number(item.amount).toLocaleString() : item.amount, startX + width - (isCompact ? 55 : 70), y + 4, { align: 'right', width: isCompact ? 48 : 62 })
    y += rowHeight
  })

  // Status & Remaining Balance
  y += 3
  const statusH = isCompact ? 16 : 19
  doc.rect(startX + 6, y, width - 12, statusH).fill('#F8FAFC').strokeColor('#E2E8F0').stroke()
  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(isCompact ? 5.5 : 6)
  doc.text('Status:', leftColX, y + 4)
  const statusColor = data.status === 'Paid' ? '#16A34A' : data.status === 'Partial' ? '#D97706' : '#DC2626'
  doc.fillColor(statusColor).text(data.status.toUpperCase(), leftColX + (isCompact ? 28 : 35), y + 4)

  doc.fillColor('#64748B').font('Helvetica').fontSize(isCompact ? 5.2 : 5.8)
  doc.text(`Bal: PKR ${Number(data.outstandingAmount).toLocaleString()}`, startX + width - (isCompact ? 95 : 120), y + 4, { align: 'right', width: isCompact ? 88 : 112 })

  // Instructions
  y += statusH + 3
  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(isCompact ? 5.5 : 6)
  doc.text('PAYMENT INSTRUCTIONS:', startX + 6, y)
  y += isCompact ? 7 : 8

  const instructionsList = Array.isArray(settings.instructions)
    ? settings.instructions
    : DEFAULT_CHALLAN_SETTINGS.instructions
  doc.font('Helvetica').fontSize(isCompact ? 4.8 : 5.4).fillColor('#64748B')
  if (instructionsList.length > 0) {
    instructionsList.slice(0, 4).forEach((inst) => {
      doc.text(inst, startX + 6, y, { width: width - 12, ellipsis: true })
      y += isCompact ? 6.5 : 7.5
    })
  } else {
    doc.font('Helvetica-Oblique').text('No payment instructions configured.', startX + 6, y, { width: width - 12, ellipsis: true })
  }

  // Signatures Section
  const sigY = topY + panelHeight - (isCompact ? 38 : 44)
  const halfCol = (width - 24) / 2
  doc.moveTo(startX + 8, sigY + 16).lineTo(startX + 8 + halfCol, sigY + 16).strokeColor('#94A3B8').lineWidth(0.5).stroke()
  doc.moveTo(startX + 16 + halfCol, sigY + 16).lineTo(startX + width - 8, sigY + 16).strokeColor('#94A3B8').lineWidth(0.5).stroke()

  doc.fontSize(isCompact ? 5 : 5.8).fillColor('#475569').font('Helvetica')
  const leftSig = settings.signatories?.leftTitle || 'Depositor / Student Sign'
  const rightSig = settings.signatories?.rightTitle || 'Bank / Cashier Stamp'
  doc.text(leftSig, startX + 8, sigY + 18, { width: halfCol, align: 'center', ellipsis: true })
  doc.text(rightSig, startX + 16 + halfCol, sigY + 18, { width: halfCol, align: 'center', ellipsis: true })
}

const buildFeeChallanPDF = (doc, data, customSettings = {}) => {
  const settings = { ...DEFAULT_CHALLAN_SETTINGS, ...customSettings }
  const is2Part = settings.layout === '2-part'

  if (is2Part) {
    // 2-Part Layout (A4 Landscape: Office Copy & Student Copy)
    const panelWidth = 390
    const col1X = 20
    const col2X = 432
    const divider = 421

    const copies = (settings.copies && settings.copies.length >= 2) ? settings.copies : [
      { name: 'Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#1E3A8A' },
      { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#065F46' },
    ]

    // Panel 1: Office Copy
    drawChallanSinglePanel(doc, {
      startX: col1X,
      width: panelWidth,
      copyTitle: copies[0].name || 'Office Copy',
      copySubtitle: copies[0].subtitle || '(School Administration & Accounts Record)',
      badgeColor: copies[0].badgeColor || '#1E3A8A',
      data,
      settings,
    })

    // Cutting Guide in center
    doc.save()
    doc.dash(3, { space: 3 })
    doc.moveTo(divider, 15).lineTo(divider, 580).strokeColor('#94A3B8').stroke()
    doc.fontSize(8).fillColor('#64748B').text('✂', divider - 3, 290)
    doc.restore()

    // Panel 2: Student Copy
    drawChallanSinglePanel(doc, {
      startX: col2X,
      width: panelWidth,
      copyTitle: copies[1].name || 'Student Copy',
      copySubtitle: copies[1].subtitle || '(Student & Parent Personal Record)',
      badgeColor: copies[1].badgeColor || '#065F46',
      data,
      settings,
    })
  } else {
    // 3-Part Layout (A4 Landscape)
    const panelWidth = 260
    const col1X = 15
    const col2X = 289
    const col3X = 563

    const copies = (settings.copies && settings.copies.length >= 3) ? settings.copies : [
      { name: 'Outer Office Copy', subtitle: '(Bank / External Clearing Copy)', badgeColor: '#1E3A8A' },
      { name: 'Inner Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#065F46' },
      { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#581C87' },
    ]

    // Panel 1: Outer Office Copy
    drawChallanSinglePanel(doc, {
      startX: col1X,
      width: panelWidth,
      copyTitle: copies[0].name,
      copySubtitle: copies[0].subtitle,
      badgeColor: copies[0].badgeColor || '#1E3A8A',
      data,
      settings,
    })

    // Cutting Guide 1
    doc.save()
    doc.dash(3, { space: 3 })
    doc.moveTo(279, 15).lineTo(279, 580).strokeColor('#94A3B8').stroke()
    doc.fontSize(8).fillColor('#64748B').text('✂', 276, 290)
    doc.restore()

    // Panel 2: Inner Office Copy
    drawChallanSinglePanel(doc, {
      startX: col2X,
      width: panelWidth,
      copyTitle: copies[1].name,
      copySubtitle: copies[1].subtitle,
      badgeColor: copies[1].badgeColor || '#065F46',
      data,
      settings,
    })

    // Cutting Guide 2
    doc.save()
    doc.dash(3, { space: 3 })
    doc.moveTo(553, 15).lineTo(553, 580).strokeColor('#94A3B8').stroke()
    doc.fontSize(8).fillColor('#64748B').text('✂', 550, 290)
    doc.restore()

    // Panel 3: Student Copy
    drawChallanSinglePanel(doc, {
      startX: col3X,
      width: panelWidth,
      copyTitle: copies[2].name,
      copySubtitle: copies[2].subtitle,
      badgeColor: copies[2].badgeColor || '#581C87',
      data,
      settings,
    })
  }
}

module.exports = {
  buildPaymentReceiptPDF,
  DEFAULT_CHALLAN_SETTINGS,
  drawChallanSinglePanel,
  buildFeeChallanPDF,
}
