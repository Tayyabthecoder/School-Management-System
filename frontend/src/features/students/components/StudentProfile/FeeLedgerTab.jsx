import React from 'react'
import {
  CircleDollarSign,
  Plus,
  Percent,
  Wallet,
  Download,
} from 'lucide-react'
import Badge from '../../../../components/ui/Badge'
import Button from '../../../../components/ui/Button'
import { formatPKR, formatDate } from '../../../../lib/formatters'

export default function FeeLedgerTab({
  student,
  fees = [],
  totalFeeDue,
  totalFeePaid,
  totalOutstanding,
  feePaymentPct,
  onOpenAssignFee,
  onOpenConcession,
  onOpenPayment,
  onDownloadChallan,
}) {
  return (
    <div className="space-y-6">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Fee Ledger & Payment Accounts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student fee structures, apply scholarships/concessions, and collect payments.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onOpenAssignFee}
        >
          Assign Additional Fee
        </Button>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <p className="text-2xs font-semibold text-slate-400 uppercase">Total Fees Invoiced</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatPKR(totalFeeDue)}
          </p>
        </div>
        <div className="card-surface p-5 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
          <p className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Total Amount Paid
          </p>
          <p className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
            {formatPKR(totalFeePaid)}
          </p>
        </div>
        <div className="card-surface p-5 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
          <p className="text-2xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
            Outstanding Balance
          </p>
          <p className="text-xl font-black text-amber-800 dark:text-amber-300 mt-1">
            {formatPKR(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Fee Payment Progress Bar */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Overall Fee Clearance Progress
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              totalOutstanding === 0 && totalFeeDue > 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {totalOutstanding === 0 && totalFeeDue > 0
              ? '✓ All Dues Cleared (100%)'
              : `${feePaymentPct}% Paid`}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${feePaymentPct}%` }}
            title={`Paid: ${formatPKR(totalFeePaid)}`}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${100 - feePaymentPct}%` }}
            title={`Pending: ${formatPKR(totalOutstanding)}`}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>
            Paid: <strong className="text-emerald-700 dark:text-emerald-400">{formatPKR(totalFeePaid)}</strong>
          </span>
          <span>
            Pending: <strong className="text-amber-700 dark:text-amber-400">{formatPKR(totalOutstanding)}</strong>
          </span>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/80 dark:border-slate-800">
          <div className="col-span-3">Fee Structure / Head</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2 text-right">Gross & Concession</div>
          <div className="col-span-2 text-right">Net / Paid</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Manage Actions</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {fees.length > 0 ? (
            fees.map((f) => (
              <div
                key={f._id}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs"
              >
                <div className="col-span-3">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {f.feeStructureId?.title || f.feeStructureId?.feeType || 'Monthly Tuition Fee'}
                  </p>
                  {f.discount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md mt-0.5">
                      <Percent className="w-2.5 h-2.5" /> -{formatPKR(f.discount)} (
                      {f.concessionType || 'Scholarship'})
                    </span>
                  ) : (
                    <p className="text-slate-400 mt-0.5">Invoice: {f._id?.slice(-8)}</p>
                  )}
                </div>
                <div className="col-span-2 font-medium text-slate-700 dark:text-slate-300">
                  {f.dueDate ? formatDate(f.dueDate) : '—'}
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatPKR(f.amountDue)}</p>
                  <p className="text-2xs text-slate-400">
                    {f.discount > 0 ? `Waiver: -${formatPKR(f.discount)}` : 'Full Rate'}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-black text-slate-900 dark:text-slate-100">{formatPKR(f.netAmount)}</p>
                  <p
                    className={`text-2xs font-bold ${
                      f.amountPaid > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    Paid: {formatPKR(f.amountPaid)}
                  </p>
                </div>
                <div className="col-span-1 text-center">
                  <Badge
                    variant={
                      f.status === 'Paid'
                        ? 'success'
                        : f.status === 'Overdue'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {f.status}
                  </Badge>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  {/* Adjust Concession Button */}
                  <button
                    type="button"
                    onClick={() => onOpenConcession(f)}
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                    title="Adjust Concession / Scholarship"
                  >
                    <Percent className="w-3.5 h-3.5" />
                  </button>

                  {/* Record Direct Payment Button */}
                  {f.outstandingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenPayment(f)}
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                      title="Record Payment"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Download Challan Button */}
                  {f.outstandingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => onDownloadChallan(f)}
                      className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Download Fee Challan (.pdf)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No fee invoices generated yet for this student.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
