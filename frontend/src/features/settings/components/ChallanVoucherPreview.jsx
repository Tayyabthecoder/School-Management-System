import React from 'react'
import { Eye, UserCheck } from 'lucide-react'
import Badge from '../../../components/ui/Badge'

/** Live A4-landscape voucher preview shown at the bottom of the Challan Builder. Display only. */
export default function ChallanVoucherPreview({
  safeChallanConfig,
  sampleStudent,
  visibleCopies,
  tuitionAmount,
  displayParticulars,
  grossFee,
  calculatedDiscount,
  netPayable,
  lateSurcharge,
  grossPayableAfterDue,
  activePayments,
  activeBanks,
  activeDigital,
  instructionsList,
  leftSig,
  middleSig,
  rightSig,
  sampleStudentKey,
  setSampleStudentKey,
}) {
  return (
    <>
        {/* Section 6: Real-time Live Visual Preview (A4 Landscape) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  7. Live Real-Time Voucher Preview (A4 Landscape)
                </h3>
                <Badge variant="indigo">
                  {safeChallanConfig.layout === '2-part'
                    ? '2-Part Dual-Copy'
                    : '3-Part Standard'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Preview of the printable fee voucher.
              </p>
            </div>

            {/* Interactive Preview Controls Toolbar */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Sample Student Selector */}
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">Test Profile:</span>
                <select aria-label="Preview with student"
                  value={sampleStudentKey}
                  onChange={(e) => setSampleStudentKey(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="ali" className="text-gray-900 bg-white">Ali Khan (25% Sibling Discount)</option>
                  <option value="fatima" className="text-gray-900 bg-white">Fatima Zahra (50% Merit Aid)</option>
                  <option value="hassan" className="text-gray-900 bg-white">Hassan Raza (Full Fee / No Concession)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Calculation Summary Banner */}
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">Active Heads Total</span>
              <p className="font-bold text-gray-900 dark:text-white">PKR {grossFee.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                Concession ({sampleStudent.concessionLabel.split(' ')[0]})
              </span>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">- PKR {calculatedDiscount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Net Within Due Date</span>
              <p className="font-bold text-indigo-700 dark:text-indigo-300">PKR {netPayable.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">After Due Date (+{lateSurcharge})</span>
              <p className="font-bold text-rose-700 dark:text-rose-400">PKR {grossPayableAfterDue.toLocaleString()}</p>
            </div>
          </div>

          {/* The Voucher Canvas Container */}
          <div className="p-4 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner">
            <div
              id="printable-challan-voucher"
              className={`${
                safeChallanConfig.layout === '2-part'
                  ? 'min-w-[680px]'
                  : 'min-w-[760px]'
              } bg-white p-4 rounded-xl border border-gray-300 shadow-2xl text-[10px] mx-auto`}
            >
              {/* Side-by-side Multi-Copy Grid */}
              <div
                className={`grid ${
                  safeChallanConfig.layout === '2-part'
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                } gap-3`}
              >
                {visibleCopies.map((copy, index) => {
                  const badgeColor = copy?.badgeColor || '#1E3A8A'

                  return (
                    <div
                      key={index}
                      className="border border-gray-300 rounded-lg overflow-hidden flex flex-col justify-between bg-white relative shadow-xs"
                    >
                      {/* Top School Header */}
                      <div className="p-2.5 text-white text-center shadow-xs" style={{ backgroundColor: badgeColor }}>
                        <p className="font-extrabold text-[9.5px] uppercase tracking-wider leading-tight">
                          {safeChallanConfig.instituteName || 'SCHOOL MANAGEMENT SYSTEM'}
                        </p>
                        <p className="text-[7px] font-medium opacity-90 mt-0.5">
                          {safeChallanConfig.subHeader || 'BANK & DIGITAL PAYMENT FEE CHALLAN'}
                        </p>
                      </div>

                      {/* Copy Identifier Banner */}
                      <div className="bg-slate-50 py-1.5 px-2 text-center border-b border-gray-200">
                        <p className="font-bold text-[9px] tracking-wide" style={{ color: badgeColor }}>
                          {(copy?.name || `COPY #${index + 1}`).toUpperCase()}
                        </p>
                        <p className="text-[7px] text-gray-500">{copy?.subtitle || ''}</p>
                      </div>

                      <div className="p-2 space-y-2 flex-1 flex flex-col">
                        {/* Bank & Digital Accounts Box */}
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-[8px]">
                          {activePayments.length === 0 ? (
                            <div className="text-amber-800 bg-amber-50/80 p-1.5 rounded text-[7px] text-center font-medium border border-amber-200">
                              ⚠️ No payment channels currently enabled
                            </div>
                          ) : (
                            <>
                              {activeBanks.length > 0 ? (
                                activeBanks.map((b, bi) => (
                                  <div key={bi} className="space-y-0.5">
                                    <p className="font-bold text-gray-900 truncate flex items-center gap-1">
                                      <span>🏦</span> {b.name}
                                    </p>
                                    <p className="text-gray-600 truncate text-[7.5px]">
                                      <span className="font-semibold text-gray-500">A/C:</span> {b.accountNumber}
                                      {b.accountTitle && <span className="text-gray-500 font-normal"> ({b.accountTitle})</span>}
                                    </p>
                                    {b.branchCode && (
                                      <p className="text-gray-500 text-[7px] truncate">
                                        Branch: {b.branchCode} {b.branchName ? `· ${b.branchName}` : ''}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : null}

                              {activeDigital.length > 0 && (
                                <div className={`${activeBanks.length > 0 ? 'pt-1 border-t border-slate-200' : ''} space-y-0.5`}>
                                  <span className="font-bold text-emerald-800 text-[7.5px] flex items-center gap-1">
                                    <span>⚡</span> Digital Wallets & Raast:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {activeDigital.map((d, di) => (
                                      <span
                                        key={di}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[7px]"
                                      >
                                        {d.name}: {d.accountNumber}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Metadata & Student Demographics Box */}
                        <div className="p-1.5 bg-white rounded border border-gray-200 text-[7.5px] space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Challan #:</span>
                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded">
                              {sampleStudent.challanNo}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Issue Date:</span>
                            <span className="font-medium text-gray-700">{sampleStudent.issueDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-rose-700">Due Date:</span>
                            <span className="font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                              {sampleStudent.dueDate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Month:</span>
                            <span className="font-semibold text-gray-800">{sampleStudent.month}</span>
                          </div>
                          <div className="flex justify-between items-center pt-0.5 border-t border-gray-100">
                            <span className="text-gray-500">Student:</span>
                            <span className="font-bold text-gray-900 truncate max-w-[130px]">
                              {sampleStudent.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Student ID / Roll:</span>
                            <span className="font-mono font-semibold text-indigo-700">{sampleStudent.studentId}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Class & Sec:</span>
                            <span className="font-semibold text-gray-800">
                              {sampleStudent.classGrade} - {sampleStudent.section}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Guardian:</span>
                            <span className="text-gray-700 truncate max-w-[130px]">{sampleStudent.guardian}</span>
                          </div>
                        </div>

                        {/* Line Items & Particulars Table */}
                        <div className="border border-gray-200 rounded overflow-hidden text-[7.5px]">
                          <div
                            className="p-1 text-white font-bold flex justify-between uppercase tracking-wider"
                            style={{ backgroundColor: badgeColor }}
                          >
                            <span>Particular / Head</span>
                            <span>Amount (PKR)</span>
                          </div>

                          {displayParticulars.length > 0 ? (
                            displayParticulars.map((part, pi) => (
                              <div
                                key={pi}
                                className="p-1 bg-white flex justify-between border-b border-gray-100 text-gray-800"
                              >
                                <span className="truncate max-w-[130px]">{part.name}</span>
                                <span className="font-mono font-medium">
                                  {Number(part.amount || 0).toLocaleString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="p-1 bg-white flex justify-between border-b border-gray-100 text-gray-800">
                              <span>Monthly Tuition Fee</span>
                              <span className="font-mono font-medium">{tuitionAmount.toLocaleString()}</span>
                            </div>
                          )}

                          {/* Concession / Scholarship if applicable */}
                          {calculatedDiscount > 0 && (
                            <div className="p-1 bg-emerald-50 flex justify-between border-b border-emerald-100 text-emerald-800 font-semibold">
                              <span className="truncate max-w-[130px]">{sampleStudent.concessionLabel}</span>
                              <span className="font-mono">- {calculatedDiscount.toLocaleString()}</span>
                            </div>
                          )}

                          {/* NET PAYABLE */}
                          <div className="p-1 bg-indigo-50 font-bold flex justify-between text-indigo-950 border-b border-indigo-200">
                            <span>NET PAYABLE (Within Due Date)</span>
                            <span className="font-mono">PKR {netPayable.toLocaleString()}</span>
                          </div>

                          {/* Late Surcharge */}
                          <div className="p-1 bg-white flex justify-between border-b border-gray-100 text-rose-700">
                            <span>Late Surcharge (After Due Date)</span>
                            <span className="font-mono font-medium">+ {lateSurcharge.toLocaleString()}</span>
                          </div>

                          {/* Gross Amount After Due Date */}
                          <div className="p-1 bg-rose-50 font-bold flex justify-between text-rose-900">
                            <span>TOTAL PAYABLE (After Due Date)</span>
                            <span className="font-mono">PKR {grossPayableAfterDue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Printable Instructions Box */}
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[6.5px] text-gray-600 space-y-0.5">
                          <p className="font-bold text-[7px] text-gray-700 uppercase">Payment Instructions:</p>
                          {instructionsList.length > 0 ? (
                            instructionsList.slice(0, 5).map((inst, i) => (
                              <p key={i} className="truncate">
                                {inst}
                              </p>
                            ))
                          ) : (
                            <p className="italic text-gray-500">No payment instructions configured.</p>
                          )}
                        </div>

                        {/* Barcode & Challan Serial Box */}
                        <div className="pt-1 mt-auto flex items-center justify-between border-t border-dashed border-gray-200">
                          <div className="flex gap-[1.5px] items-center h-3.5">
                            {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1].map((w, bi) => (
                              <span key={bi} className="h-full bg-slate-800" style={{ width: `${w}px` }} />
                            ))}
                          </div>
                          <span className="font-mono text-[7px] text-slate-500 font-bold">
                            {sampleStudent.challanNo}
                          </span>
                        </div>
                      </div>

                      {/* Official Signatures Footer */}
                      <div className="p-2 border-t border-gray-200 bg-slate-50 flex justify-between text-[6.5px] text-gray-600">
                        <div className="text-center">
                          <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                          <span className="truncate block max-w-[70px]">{leftSig}</span>
                        </div>
                        {middleSig && (
                          <div className="text-center">
                            <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                            <span className="truncate block max-w-[70px]">{middleSig}</span>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                          <span className="truncate block max-w-[70px]">{rightSig}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
    </>
  )
}
