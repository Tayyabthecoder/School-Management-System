import React from 'react'
import { Download, Percent, Tag } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { formatPKR } from '../../../lib/formatters'

/**
 * Column definitions of the fee ledger table on the Finance page.
 * Handlers and the id of the challan being generated come from the page.
 */
export const buildFeeLedgerColumns = ({ onDownloadChallan, onOpenConcession, onOpenPayment, downloadingChallanId }) => [
  {
    header: 'Student Name & ID',
    cell: (row) => (
      <div>
        <div className="font-semibold text-gray-900 dark:text-slate-100">
          {row.studentId ? row.studentId.fullName : 'N/A'}
        </div>
        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
          {row.studentId ? row.studentId.studentId : 'N/A'}
        </div>
      </div>
    ),
  },
  {
    header: 'Fee Title',
    cell: (row) => (
      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
        {row.feeStructureId ? row.feeStructureId.title : 'Tuition Fee'}
      </span>
    ),
  },
  {
    header: 'Base Fee',
    cell: (row) => (
      <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">
        {formatPKR(row.amountDue)}
      </span>
    ),
  },
  {
    header: 'Concession / Discount',
    cell: (row) => {
      if (row.discount > 0) {
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Tag className="w-3 h-3" /> -{formatPKR(row.discount)}
            </span>
            <div className="text-[10px] text-gray-500 dark:text-slate-400 italic">
              {row.concessionType !== 'None' ? row.concessionType : 'Institutional'}
            </div>
          </div>
        )
      }
      return <span className="text-xs text-gray-500 dark:text-slate-400">None</span>
    },
  },
  {
    header: 'Net Payable',
    cell: (row) => (
      <span className="font-bold text-gray-900 dark:text-slate-100 text-xs">
        {formatPKR(row.netAmount)}
      </span>
    ),
  },
  {
    header: 'Paid',
    cell: (row) => (
      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
        {formatPKR(row.amountPaid)}
      </span>
    ),
  },
  {
    header: 'Outstanding',
    cell: (row) => (
      <span className="font-bold text-rose-700 dark:text-rose-300 text-xs">
        {formatPKR(row.outstandingAmount)}
      </span>
    ),
  },
  {
    header: 'Due Date',
    cell: (row) => {
      const isDownloaded = Boolean(row.challanDownloadedAt)
      const activeDue = row.effectiveDueDate || row.dueDate
      const due = activeDue ? new Date(activeDue).toLocaleDateString('en-GB') : 'N/A'
      return (
        <div>
          <span className="text-xs font-bold text-gray-800 dark:text-slate-100">
            {due}
          </span>
          <div className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
            {isDownloaded ? '10d post-download' : '10d on download'}
          </div>
        </div>
      )
    },
  },
  {
    header: 'Status',
    cell: (row) => (
      <Badge
        variant={
          row.status === 'Paid'
            ? 'success'
            : row.status === 'Partial'
            ? 'warning'
            : 'danger'
        }
      >
        {row.status}
      </Badge>
    ),
  },
  {
    header: 'Actions',
    cell: (row) => (
      <div className="flex items-center gap-1.5">
        {/* Download Challan Button */}
        <button
          onClick={() => onDownloadChallan(row)}
          disabled={downloadingChallanId === row._id}
          title="Download Bank Fee Challan Voucher (Printable PDF)"
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <Download className="w-3 h-3 text-amber-700 dark:text-amber-300" />
          {downloadingChallanId === row._id ? 'Generating...' : 'Challan'}
        </button>

        {/* Apply Concession Button */}
        <button
          onClick={() => onOpenConcession(row)}
          title="Apply scholarship or discount concession"
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Percent className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
          Concession
        </button>

        {/* Record Payment Button */}
        {row.outstandingAmount > 0 && (
          <button
            onClick={() => onOpenPayment(row)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Record Payment
          </button>
        )}
      </div>
    ),
  },
]
