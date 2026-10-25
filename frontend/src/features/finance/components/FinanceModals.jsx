import React from 'react'
import { Sparkles } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { formatPKR } from '../../../lib/formatters'

export const CONCESSION_TYPES = [
  { label: 'Sibling Discount (25%)', value: 'Sibling Discount', defaultPct: 25 },
  { label: 'Merit Scholarship (50-100%)', value: 'Merit Scholarship', defaultPct: 50 },
  { label: 'Need-Based Financial Aid', value: 'Need-Based Aid', defaultPct: 30 },
  { label: 'Staff Ward Concession (50-100%)', value: 'Staff Ward Concession', defaultPct: 50 },
  { label: 'Kinship Relief', value: 'Kinship Relief', defaultPct: 20 },
  { label: 'Special Management Discount', value: 'Special Management Discount', defaultPct: 15 },
]

export function RecordPaymentModal({
  isOpen,
  onClose,
  selectedFeeRecord,
  paymentAmount,
  setPaymentAmount,
  paymentMode,
  setPaymentMode,
  submittingPayment,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen && !!selectedFeeRecord}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle={
        selectedFeeRecord
          ? `Student: ${selectedFeeRecord.studentId?.fullName} (${selectedFeeRecord.studentId?.studentId})`
          : ''
      }
      size="md"
    >
      {selectedFeeRecord && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Total Net Amount:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatPKR(selectedFeeRecord.netAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Already Paid:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatPKR(selectedFeeRecord.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-bold">
              <span className="text-rose-600 dark:text-rose-400">Outstanding Balance:</span>
              <span className="text-rose-600 dark:text-rose-400">
                {formatPKR(selectedFeeRecord.outstandingAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Payment Amount (PKR)
            </label>
            <input
              type="number"
              required
              max={selectedFeeRecord.outstandingAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online / Card</option>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingPayment}
            >
              Record Payment & Receipt
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function ApplyConcessionModal({
  isOpen,
  onClose,
  concessionFeeRecord,
  concessionType,
  setConcessionType,
  discountAmount,
  setDiscountAmount,
  concessionReason,
  setConcessionReason,
  submittingConcession,
  handleApplyPresetPercentage,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen && !!concessionFeeRecord}
      onClose={onClose}
      title="Manage Fee Concession"
      subtitle="Institutional scholarship, financial relief and sibling discount management"
      size="lg"
    >
      {concessionFeeRecord && (
        <div>
          <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">Student:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {concessionFeeRecord.studentId?.fullName} ({concessionFeeRecord.studentId?.studentId})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Base Monthly Tuition:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatPKR(concessionFeeRecord.amountDue)}
              </span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Concession Category
              </label>
              <select
                value={concessionType}
                onChange={(e) => {
                  const nextVal = e.target.value
                  setConcessionType(nextVal)
                  const found = CONCESSION_TYPES.find((c) => c.value === nextVal)
                  if (found) {
                    handleApplyPresetPercentage(found.defaultPct)
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CONCESSION_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Quick Preset Discount
                </label>
                <span className="text-[11px] text-slate-400">Click to calculate</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '0% (None)', pct: 0 },
                  { label: '10%', pct: 10 },
                  { label: '25%', pct: 25 },
                  { label: '50%', pct: 50 },
                  { label: '100% (Full)', pct: 100 },
                ].map((p) => {
                  const calcAmount = Math.round((concessionFeeRecord.amountDue * p.pct) / 100)
                  const isSelected = Number(discountAmount) === calcAmount
                  return (
                    <button
                      key={p.pct}
                      type="button"
                      onClick={() => handleApplyPresetPercentage(p.pct)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Discount Amount (PKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={concessionFeeRecord.amountDue}
                  required
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  PKR
                </span>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            {concessionFeeRecord && (
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Base Amount:</span>
                  <span>{formatPKR(concessionFeeRecord.amountDue)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Applied Concession:</span>
                  <span>- {formatPKR(discountAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-indigo-900 dark:text-indigo-300 font-bold border-t border-emerald-200/60 dark:border-emerald-800 pt-1.5">
                  <span>New Net Payable:</span>
                  <span>
                    {formatPKR(Math.max(0, concessionFeeRecord.amountDue - (Number(discountAmount) || 0)))}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Justification / Administrative Reason
              </label>
              <textarea
                rows="2"
                value={concessionReason}
                onChange={(e) => setConcessionReason(e.target.value)}
                placeholder="e.g., Approved based on 3 siblings studying in SMS or merit scholarship."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                size="sm"
                loading={submittingConcession}
              >
                Apply Concession & Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}

export function GenerateMonthlyChallansModal({
  isOpen,
  onClose,
  onSubmit,
  studentsCount,
  generationTargetDate,
  setGenerationTargetDate,
  forceRegenerate,
  setForceRegenerate,
  generatingChallans,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Monthly Student Fee Challans"
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-1">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-4 h-4" /> Automated 1st-of-Month Recurring Billing
          </div>
          <p>
            This process scans all active classes (Play Junior, Grade 1 to 12) and enrolled students ({studentsCount || 189} active):
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-indigo-800 dark:text-indigo-300/90 text-[11px]">
            <li>Ensures Tuition FeeStructure exists for each grade</li>
            <li>Calculates base tuition & automatically preserves scholarships/sibling discounts</li>
            <li>Sets due date to fall 10 days after the fee challan is downloaded</li>
            <li>Skips students who already have a challan for this cycle (idempotent)</li>
          </ul>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Select Target Month & Year
          </label>
          <input
            type="month"
            required
            value={generationTargetDate.slice(0, 7)}
            onChange={(e) => setGenerationTargetDate(`${e.target.value}-01`)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="forceRegenerate"
            checked={forceRegenerate}
            onChange={(e) => setForceRegenerate(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
          />
          <label htmlFor="forceRegenerate" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <span className="font-semibold">Force re-generation</span>
            <p className="text-[11px] text-gray-500">Generate even for students who already have a challan this month.</p>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={generatingChallans}
          >
            Generate Challans Now
          </Button>
        </div>
      </form>
    </Modal>
  )
}
