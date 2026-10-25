const { drawHeader, drawFooter } = require('./pdf.base')
const path = require('path')

/**
 * Build Generic Tabular Report PDF (FR-RP-03)
 * Supports dynamic column sizing, automatic page orientation handling, and multi-page tables.
 */
const buildTabularReportPDF = (doc, { title = 'Custom Report', subtitle = '', columns = [], rows = [], branding = {} }) => {
  const brand = branding || {}
  const headerColor = brand.primaryColor || '#3730A3'
  drawHeader(doc, title, subtitle || `Generated on ${new Date().toLocaleDateString('en-GB')}`, brand)

  let y = 120
  const startX = 40
  const totalWidth = Math.floor(doc.page.width - 80) || 515
  const colCount = Math.min(columns.length, 14) || 1
  const colWidth = Math.floor(totalWidth / colCount)
  const maxY = Math.floor(doc.page.height - 70) || 720

  // Table Header
  doc.rect(startX, y, totalWidth, 20).fill(headerColor)
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(colCount > 8 ? 7 : 8)
  columns.slice(0, colCount).forEach((col, idx) => {
    const x = startX + idx * colWidth
    doc.text(String(col.header), x + 4, y + 5, { width: colWidth - 8, align: 'left', ellipsis: true })
  })

  y += 20

  // Table Rows
  rows.forEach((row, rIdx) => {
    if (y > maxY) {
      doc.addPage()
      drawHeader(doc, `${title} (Contd.)`, subtitle, brand)
      y = 120
      doc.rect(startX, y, totalWidth, 20).fill(headerColor)
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(colCount > 8 ? 7 : 8)
      columns.slice(0, colCount).forEach((col, idx) => {
        const x = startX + idx * colWidth
        doc.text(String(col.header), x + 4, y + 5, { width: colWidth - 8, align: 'left', ellipsis: true })
      })
      y += 20
    }

    const bg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
    doc.rect(startX, y, totalWidth, 18).fill(bg).strokeColor('#F1F5F9').stroke()
    doc.fillColor('#1E293B').font('Helvetica').fontSize(colCount > 8 ? 6.5 : 8)

    columns.slice(0, colCount).forEach((col, idx) => {
      const x = startX + idx * colWidth
      const rawVal = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-'
      doc.text(rawVal, x + 4, y + 5, { width: colWidth - 8, align: 'left', ellipsis: true })
    })

    y += 18
  })

  drawFooter(doc, title)
}

module.exports = {
  buildTabularReportPDF,
}
