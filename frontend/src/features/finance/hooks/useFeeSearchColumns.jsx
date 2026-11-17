import { ChevronRight, Download, Percent, Tag } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { formatPKR } from '../../../lib/formatters'

export function useFeeSearchColumns({ handleOpenPayment, handleOpenConcessionModal, handleDownloadChallan, handleJumpToLedger, downloadingChallanId }) {
  const searchColumns = [
    {
      header: 'Student & Roll ID',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {row.studentId ? row.studentId.fullName : 'N/A'}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">
            {row.studentId ? row.studentId.studentId : 'N/A'}
          </div>
          {row.studentId?.guardian?.name && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              G: {row.studentId.guardian.name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Grade & Section',
      cell: (row) => {
        const clsName = row.studentId?.classId?.name || 'Class'
        const secId = row.studentId?.sectionId || 'A'
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {clsName} · Sec {secId}
          </span>
        )
      },
    },
    {
      header: 'Challan Voucher #',
      cell: (row) => {
        const activeDue = row.effectiveDueDate || row.dueDate || row.createdAt
        const challanYear = activeDue ? new Date(activeDue).getFullYear() : new Date().getFullYear()
        const suffix = row._id ? row._id.slice(-6).toUpperCase() : '------'
        const challanCode = `CHL-${challanYear}-${suffix}`
        return (
          <div>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {challanCode}
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
              {row.feeStructureId?.title || 'Tuition Fee'}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Base Fee',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {formatPKR(row.amountDue)}
        </span>
      ),
    },
    {
      header: 'Concession',
      cell: (row) => {
        if (row.discount > 0) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Tag className="w-3 h-3" /> -{formatPKR(row.discount)}
              </span>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                {row.concessionType !== 'None' ? row.concessionType : 'Institutional'}
              </div>
            </div>
          )
        }
        return <span className="text-xs text-slate-500 dark:text-slate-400">None</span>
      },
    },
    {
      header: 'Net Payable',
      cell: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
          {formatPKR(row.netAmount)}
        </span>
      ),
    },
    {
      header: 'Paid',
      cell: (row) => (
        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
          {formatPKR(row.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      cell: (row) => (
        <span className="font-bold text-rose-700 dark:text-rose-400 text-xs">
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
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {due}
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleDownloadChallan(row)}
            disabled={downloadingChallanId === row._id}
            title="Download Bank Fee Challan Voucher (Printable PDF)"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            {downloadingChallanId === row._id ? 'Generating...' : 'Challan'}
          </button>

          <button
            onClick={() => handleOpenConcessionModal(row)}
            title="Apply scholarship or discount concession"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Percent className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            Concession
          </button>

          {row.outstandingAmount > 0 && (
            <button
              onClick={() => handleOpenPayment(row)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Record Payment
            </button>
          )}

          <button
            onClick={() => handleJumpToLedger(row)}
            title="Open section fee ledger"
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Ledger <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ]

  return { searchColumns }
}
