const { generatePDFBuffer, drawHeader, drawFooter } = require('./pdf.base')
const { buildReportCardPDF, buildTranscriptPDF } = require('./academic.pdf')
const {
  buildPaymentReceiptPDF,
  DEFAULT_CHALLAN_SETTINGS,
  drawChallanSinglePanel,
  buildFeeChallanPDF,
} = require('./finance.pdf')
const { buildPayslipPDF } = require('./hr.pdf')
const { buildTabularReportPDF } = require('./reports.pdf')

module.exports = {
  generatePDFBuffer,
  drawHeader,
  drawFooter,
  buildReportCardPDF,
  buildTranscriptPDF,
  buildPaymentReceiptPDF,
  DEFAULT_CHALLAN_SETTINGS,
  drawChallanSinglePanel,
  buildFeeChallanPDF,
  buildPayslipPDF,
  buildTabularReportPDF,
}
