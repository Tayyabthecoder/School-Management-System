import React from 'react'
import { CheckCircle2, Download, Eye } from 'lucide-react'
import { formatPKR } from '../../../../lib/formatters'
import Badge from '../../../../components/ui/Badge'

export default function RegistrationSuccessDialog({
  registrationSuccessData,
  onClose,
  handleDownloadPDF,
  setRegistrationSuccessData,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center relative">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black">Student Registered Successfully!</h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                Enrollment and fee structure initialized in the system database.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Identification Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    {registrationSuccessData.data?.fullName || 'Enrolled Student'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ID: <strong className="text-indigo-700 font-mono font-bold">{registrationSuccessData.data?.studentId}</strong>
                  </p>
                </div>
                <Badge variant={registrationSuccessData.payment ? 'success' : 'warning'}>
                  {registrationSuccessData.payment ? 'Fee Paid' : 'Challan Pending'}
                </Badge>
              </div>

              {/* Financial Snapshot */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5 text-xs text-indigo-950">
                {registrationSuccessData.payment ? (
                  <div className="flex justify-between items-center">
                    <span>Payment Receipt No:</span>
                    <strong className="font-mono text-emerald-700">{registrationSuccessData.receiptNo || 'REC-XXXXX'}</strong>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>Generated Invoices:</span>
                    <strong>{registrationSuccessData.fees?.length || 1} Fee Item(s)</strong>
                  </div>
                )}
                {registrationSuccessData.payment && (
                  <div className="flex justify-between items-center">
                    <span>Amount Collected Upfront:</span>
                    <strong className="text-emerald-800 text-sm font-black">{formatPKR(registrationSuccessData.payment?.amountPaid)}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {registrationSuccessData.paymentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(
                      `/finance/receipt/${registrationSuccessData.paymentId}`,
                      `Receipt_${registrationSuccessData.receiptNo || 'Payment'}.pdf`
                    )}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Payment Receipt (.pdf)</span>
                  </button>
                )}

                {registrationSuccessData.firstFeeId && !registrationSuccessData.paymentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(
                      `/finance/challan/${registrationSuccessData.firstFeeId}/pdf`,
                      `Fee_Challan_${registrationSuccessData.data?.studentId || 'Challan'}.pdf`
                    )}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Fee Challan Voucher (.pdf)</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`/students/${registrationSuccessData.data?._id}`}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>View Profile</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => { setRegistrationSuccessData(null); onClose(); }}
                    className="py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>
  )
}
