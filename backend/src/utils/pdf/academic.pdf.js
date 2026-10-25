const { drawHeader, drawFooter } = require('./pdf.base')

const buildReportCardPDF = (doc, data, branding = {}) => {
  const brand = (branding && Object.keys(branding).length > 0) ? branding : (data.branding || {})
  drawHeader(doc, 'Official Academic Report Card', `Academic Term: ${data.termName || 'Term 1'}`, brand)

  let y = 125

  // Student Info Box
  doc.rect(40, y, 515, 65).fill('#F9FAFB').strokeColor('#E5E7EB').stroke()
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10)

  doc.text(`Student Name: `, 50, y + 10).font('Helvetica').text(data.studentName, 130, y + 10)
  doc.font('Helvetica-Bold').text(`Student ID: `, 50, y + 26).font('Helvetica').text(data.studentId, 130, y + 26)
  doc.font('Helvetica-Bold').text(`Class & Section: `, 50, y + 42).font('Helvetica').text(`${data.className} - Section ${data.sectionId}`, 130, y + 42)

  doc.font('Helvetica-Bold').text(`Attendance Rate: `, 320, y + 10).font('Helvetica').text(`${data.attendancePercentage || '96'}%`, 410, y + 10)
  doc.font('Helvetica-Bold').text(`Academic Year: `, 320, y + 26).font('Helvetica').text(`2026`, 410, y + 26)
  doc.font('Helvetica-Bold').text(`Issue Date: `, 320, y + 42).font('Helvetica').text(new Date().toLocaleDateString('en-GB'), 410, y + 42)

  y += 85

  // Subject Grades Table
  doc.font('Helvetica-Bold').fontSize(11).text('Academic Grades Breakdown', 40, y)
  y += 18

  // Table Header
  doc.rect(40, y, 515, 24).fill('#4F46E5')
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
  doc.text('SUBJECT', 50, y + 7)
  doc.text('MAX MARKS', 220, y + 7)
  doc.text('MARKS OBTAINED', 320, y + 7)
  doc.text('PERCENTAGE', 420, y + 7)
  doc.text('GRADE', 500, y + 7)

  y += 24

  doc.font('Helvetica').fontSize(9).fillColor('#1F2937')
  if (data.grades && data.grades.length > 0) {
    data.grades.forEach((g, index) => {
      const bg = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
      doc.rect(40, y, 515, 22).fill(bg).strokeColor('#F3F4F6').stroke()

      doc.fillColor('#111827')
      doc.text(g.subjectName, 50, y + 6)
      doc.text(String(g.maxMarks), 220, y + 6)
      doc.text(String(g.marksObtained), 320, y + 6)
      doc.text(`${g.percentage}%`, 420, y + 6)

      const gradeColor = g.gradeLetter === 'F' ? '#DC2626' : '#16A34A'
      doc.fillColor(gradeColor).font('Helvetica-Bold').text(g.gradeLetter, 500, y + 6).font('Helvetica')

      y += 22
    })
  } else {
    doc.rect(40, y, 515, 24).fill('#FFFFFF')
    doc.text('No formal exam grades recorded for this term.', 50, y + 7)
    y += 24
  }

  y += 40
  // Signatures
  doc.moveTo(50, y).lineTo(200, y).strokeColor('#9CA3AF').stroke()
  doc.moveTo(355, y).lineTo(505, y).strokeColor('#9CA3AF').stroke()

  doc.fontSize(9).fillColor('#4B5563')
  doc.text('Class Teacher Signature', 50, y + 6)
  doc.text('Principal Signature & Seal', 355, y + 6)

  drawFooter(doc, 'Report Card')
}

const buildTranscriptPDF = (doc, data, branding = {}) => {
  const brand = (branding && Object.keys(branding).length > 0) ? branding : (data.branding || {})
  drawHeader(doc, 'Official Academic Transcript', 'Cumulative Academic Achievement Record', brand)

  let y = 120

  // Student Info Box
  doc.rect(40, y, 515, 65).fill('#F8FAFC').strokeColor('#CBD5E1').stroke()
  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9)

  doc.text('Student Name:', 50, y + 10).font('Helvetica').text(data.studentName, 135, y + 10)
  doc.font('Helvetica-Bold').text('Student ID:', 50, y + 26).font('Helvetica').text(data.studentId, 135, y + 26)
  doc.font('Helvetica-Bold').text('Current Class:', 50, y + 42).font('Helvetica').text(`${data.currentClass || 'N/A'} (Sec ${data.sectionId || 'A'})`, 135, y + 42)

  doc.font('Helvetica-Bold').text('Father/Guardian:', 300, y + 10).font('Helvetica').text(data.fatherName || data.guardianName || 'N/A', 390, y + 10)
  doc.font('Helvetica-Bold').text('Date of Birth:', 300, y + 26).font('Helvetica').text(data.dob ? new Date(data.dob).toLocaleDateString('en-GB') : 'N/A', 390, y + 26)
  doc.font('Helvetica-Bold').text('Date Issued:', 300, y + 42).font('Helvetica').text(new Date().toLocaleDateString('en-GB'), 390, y + 42)

  y += 75

  // Iterate over terms/years
  if (!data.terms || data.terms.length === 0) {
    doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(10).text('No recorded examination grades found.', 50, y)
    y += 30
  } else {
    data.terms.forEach((term) => {
      // Check page break
      if (y > 660) {
        doc.addPage()
        drawHeader(doc, 'Official Academic Transcript (Contd.)', data.studentName, brand)
        y = 120
      }

      // Term Header Box
      doc.rect(40, y, 515, 20).fill('#1E293B')
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
      doc.text(`${term.academicYear || ''} • ${term.termName} • Class: ${term.className || data.currentClass}`, 48, y + 5)
      y += 20

      // Table column headers
      doc.rect(40, y, 515, 18).fill('#E2E8F0')
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8)
      doc.text('SUBJECT', 48, y + 5)
      doc.text('MAX MARKS', 230, y + 5)
      doc.text('OBTAINED', 320, y + 5)
      doc.text('PERCENTAGE', 410, y + 5)
      doc.text('GRADE', 490, y + 5)
      y += 18

      // Table rows
      term.grades.forEach((g, idx) => {
        if (y > 720) {
          doc.addPage()
          y = 50
        }
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
        doc.rect(40, y, 515, 16).fill(rowBg).strokeColor('#F1F5F9').stroke()
        doc.fillColor('#1E293B').font('Helvetica').fontSize(8)
        doc.text(g.subjectName, 48, y + 4)
        doc.text(String(g.maxMarks), 230, y + 4)
        doc.text(String(g.marksObtained), 320, y + 4)
        doc.text(`${g.percentage}%`, 410, y + 4)
        doc.font('Helvetica-Bold').text(g.gradeLetter, 490, y + 4)
        y += 16
      })

      // Term subtotal
      doc.rect(40, y, 515, 18).fill('#EEF2FF')
      doc.fillColor('#3730A3').font('Helvetica-Bold').fontSize(8)
      doc.text(`Term Aggregate: ${term.totalMarksObtained} / ${term.totalMaxMarks} (${term.percentage}%)`, 48, y + 5)
      doc.text(`Grade: ${term.gradeLetter}`, 480, y + 5)
      y += 26
    })
  }

  // Cumulative Summary Card
  if (y > 630) {
    doc.addPage()
    y = 50
  }

  doc.rect(40, y, 515, 55).fill('#F0FDF4').strokeColor('#BBF7D0').stroke()
  doc.fillColor('#166534').font('Helvetica-Bold').fontSize(10)
  doc.text('CUMULATIVE ACADEMIC SUMMARY', 50, y + 8)

  doc.font('Helvetica').fontSize(9).fillColor('#14532D')
  doc.text(`Total Terms Evaluated: ${data.cumulative?.totalTerms || 0}`, 50, y + 24)
  doc.text(`Total Marks: ${data.cumulative?.totalMarksObtained || 0} / ${data.cumulative?.totalMaxMarks || 0}`, 50, y + 38)

  doc.text(`Cumulative Percentage: ${data.cumulative?.percentage || 0}%`, 300, y + 24)
  doc.font('Helvetica-Bold').fontSize(11).text(`Overall CGPA / Grade: ${data.cumulative?.gradeLetter || 'N/A'}`, 300, y + 38)

  y += 75

  // Signatures
  if (y > 690) {
    doc.addPage()
    y = 60
  }

  doc.moveTo(60, y + 35).lineTo(200, y + 35).strokeColor('#94A3B8').stroke()
  doc.moveTo(350, y + 35).lineTo(490, y + 35).strokeColor('#94A3B8').stroke()

  doc.fillColor('#475569').font('Helvetica').fontSize(8)
  doc.text('Controller of Examinations', 60, y + 40, { width: 140, align: 'center' })
  doc.text('Principal / Head of Institution', 350, y + 40, { width: 140, align: 'center' })

  drawFooter(doc, 'Official Transcript')
}

module.exports = {
  buildReportCardPDF,
  buildTranscriptPDF,
}
