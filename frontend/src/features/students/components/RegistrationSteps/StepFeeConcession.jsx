import React from 'react'
import { CircleDollarSign, CheckCircle2, Wallet, CreditCard, Percent, Tag, AlertCircle, Check, Receipt } from 'lucide-react'
import { formatPKR, formatDate } from '../../../../lib/formatters'
import Badge from '../../../../components/ui/Badge'

export default function StepFeeConcession({
  newStudent,
  setNewStudent,
  formErrors,
  clearFieldError,
  currentModalClass,
  classFeeStructures,
  loadingFeeStructures,
  selectedFeeStructures,
  grossFeeTotal,
  calculatedDiscount,
  netPayableTotal,
}) {
  return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800 text-gray-800 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">Fee Schedule & Concession Setup</h3>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                      Class: <strong>{currentModalClass?.name}</strong>
                    </span>
                  </div>

                  {/* 1. Fee Structures Selection List */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">
                          Applicable Fee Heads
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">Select active fees for this grade level</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                selectedFeeStructureIds: classFeeStructures.map(s => s._id),
                              }
                            }))
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                selectedFeeStructureIds: [],
                              }
                            }))
                          }}
                          className="text-[11px] text-gray-500 dark:text-slate-400 hover:text-gray-700 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {loadingFeeStructures ? (
                      <div className="py-6 text-center text-xs text-gray-500 dark:text-slate-400 animate-pulse">
                        Loading class fee structures…
                      </div>
                    ) : classFeeStructures.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {classFeeStructures.map((structure) => {
                          const isSelected = newStudent.feeSetup?.selectedFeeStructureIds?.includes(structure._id)
                          return (
                            <div
                              key={structure._id}
                              onClick={() => {
                                setNewStudent(prev => {
                                  const currentIds = prev.feeSetup?.selectedFeeStructureIds || []
                                  const nextIds = currentIds.includes(structure._id)
                                    ? currentIds.filter(id => id !== structure._id)
                                    : [...currentIds, structure._id]
                                  return {
                                    ...prev,
                                    feeSetup: { ...prev.feeSetup, selectedFeeStructureIds: nextIds }
                                  }
                                })
                              }}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 shadow-xs ring-1 ring-emerald-400'
                                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                  isSelected ? 'bg-emerald-700 border-emerald-600 text-white' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{structure.title || structure.feeType}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-slate-400">Due: {structure.dueDate ? formatDate(structure.dueDate) : '—'}</p>
                                </div>
                              </div>
                              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-200 ml-2 whitespace-nowrap">
                                {formatPKR(structure.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 text-center text-xs text-gray-500 dark:text-slate-400">
                        No active fee structures found for {currentModalClass?.name || 'this class'}. Fees can be assigned later.
                      </div>
                    )}
                  </div>

                  {/* 2. Scholarship & Concession Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">
                        Scholarship & Concession Waiver
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400">Optional discount category</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                          Concession Category
                        </label>
                        <select aria-label="Concession Category"
                          value={newStudent.feeSetup?.concessionType || 'None'}
                          onChange={(e) => {
                            const val = e.target.value
                            setNewStudent(prev => ({
                              ...prev,
                              feeSetup: {
                                ...prev.feeSetup,
                                concessionType: val,
                                discountValue: val === 'None' ? 0 : prev.feeSetup.discountValue,
                              }
                            }))
                            clearFieldError('discountValue')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white dark:bg-slate-900 font-medium"
                        >
                          <option value="None">None (Standard Tuition)</option>
                          <option value="Need-Based Scholarship">Need-Based Scholarship</option>
                          <option value="Merit Scholarship">Merit Scholarship</option>
                          <option value="Sibling Concession">Sibling Concession</option>
                          <option value="Teacher Child Discount">Teacher Child Discount</option>
                          <option value="Staff Concession">Staff Concession</option>
                          <option value="Special Management Concession">Special Management Concession</option>
                          <option value="Orphan Support">Orphan Support</option>
                        </select>
                      </div>

                      {newStudent.feeSetup?.concessionType !== 'None' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                              Discount Mode & Value
                            </label>
                            <div className="flex gap-1.5">
                              <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-600 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewStudent(prev => ({
                                      ...prev,
                                      feeSetup: { ...prev.feeSetup, discountType: 'percentage' }
                                    }))
                                    clearFieldError('discountValue')
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    newStudent.feeSetup?.discountType === 'percentage'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                                  }`}
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewStudent(prev => ({
                                      ...prev,
                                      feeSetup: { ...prev.feeSetup, discountType: 'fixed' }
                                    }))
                                    clearFieldError('discountValue')
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    newStudent.feeSetup?.discountType === 'fixed'
                                      ? 'bg-indigo-600 text-white'
                                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                                  }`}
                                >
                                  PKR
                                </button>
                              </div>
                              <input
                                type="number"
                                min="0"
                                max={newStudent.feeSetup?.discountType === 'percentage' ? 100 : grossFeeTotal}
                                value={newStudent.feeSetup?.discountValue || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                                  setNewStudent(prev => ({
                                    ...prev,
                                    feeSetup: { ...prev.feeSetup, discountValue: val }
                                  }))
                                  clearFieldError('discountValue')
                                }}
                                placeholder={newStudent.feeSetup?.discountType === 'percentage' ? 'e.g. 25' : 'e.g. 2000'}
                                className={`flex-1 px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900 font-bold ${
                                  formErrors.discountValue ? 'border-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-600/20'
                                }`}
                              />
                            </div>
                            {formErrors.discountValue && (
                              <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold">{formErrors.discountValue}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                              Approval Remarks / Reason
                            </label>
                            <input aria-label="Approval Remarks / Reason"
                              type="text"
                              value={newStudent.feeSetup?.concessionReason || ''}
                              onChange={(e) => setNewStudent(prev => ({
                                ...prev,
                                feeSetup: { ...prev.feeSetup, concessionReason: e.target.value }
                              }))}
                              placeholder="e.g. Approved on merit rank #1"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3. Live Financial Breakdown Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                    <div className="grid grid-cols-3 gap-3 text-center divide-x divide-white/10">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Gross Total</p>
                        <p className="text-base font-bold mt-0.5">{formatPKR(grossFeeTotal)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">{selectedFeeStructures.length} fee item(s)</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Concession</p>
                        <p className="text-base font-bold text-emerald-400 mt-0.5">
                          {calculatedDiscount > 0 ? `- ${formatPKR(calculatedDiscount)}` : 'PKR 0'}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{newStudent.feeSetup?.concessionType || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Net Payable</p>
                        <p className="text-lg font-black text-amber-300 mt-0.5">{formatPKR(netPayableTotal)}</p>
                        <p className="text-[10px] text-indigo-200 font-semibold">Net Enrollment Dues</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Payment Collection / Challan Status Option */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">
                      Payment Collection & Voucher Issuance
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setNewStudent(prev => ({
                          ...prev,
                          feeSetup: { ...prev.feeSetup, initialPaymentStatus: 'Pending' }
                        }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          newStudent.feeSetup?.initialPaymentStatus === 'Pending'
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 shadow-sm ring-2 ring-amber-400/30'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Mark as Pending (Issue Challan)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Issues 3-copy student bank fee voucher for counter or bank collection.
                        </p>
                      </div>

                      <div
                        onClick={() => setNewStudent(prev => ({
                          ...prev,
                          feeSetup: { ...prev.feeSetup, initialPaymentStatus: 'Paid' }
                        }))}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          newStudent.feeSetup?.initialPaymentStatus === 'Paid'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Collect Upfront (Mark as Paid)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Record immediate payment at registration desk & generate official receipt.
                        </p>
                      </div>
                    </div>

                    {newStudent.feeSetup?.initialPaymentStatus === 'Paid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                            Payment Mode <span className="text-red-500">*</span>
                          </label>
                          <select aria-label="Payment Mode"
                            value={newStudent.feeSetup?.paymentMode || 'Cash'}
                            onChange={(e) => setNewStudent(prev => ({
                              ...prev,
                              feeSetup: { ...prev.feeSetup, paymentMode: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white dark:bg-slate-900 font-medium"
                          >
                            <option value="Cash">Cash (Counter Collection)</option>
                            <option value="Bank Transfer">Bank Transfer / Deposit</option>
                            <option value="Online">Online Portal</option>
                            <option value="Cheque">Cheque / Pay Order</option>
                            <option value="JazzCash">JazzCash</option>
                            <option value="EasyPaisa">EasyPaisa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                            Reference / Remarks
                          </label>
                          <input aria-label="Reference / Remarks"
                            type="text"
                            value={newStudent.feeSetup?.paymentRemarks || ''}
                            onChange={(e) => setNewStudent(prev => ({
                              ...prev,
                              feeSetup: { ...prev.feeSetup, paymentRemarks: e.target.value }
                            }))}
                            placeholder="e.g. Counter deposit or Bank txn #8942"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
  )
}
