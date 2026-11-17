import React from 'react'
import { CheckCircle2, Calendar, Zap } from 'lucide-react'

/** Status and controls of the automatic monthly challan run. */
export default function MonthlyChallanControlCard({
  students,
  cronStatus,
  setShowGenerateModal,
}) {
  return (
        <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-indigo-500/30">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    Automated Recurring Fee Challan System
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Cron Active
                  </span>
                  <span className="text-xs text-indigo-200/80 hidden sm:inline">
                    • 1st of every month @ 00:00 (Midnight PKT)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Generates monthly tuition fee challans for all enrolled students across all 13 grades (Play Junior to Grade 12) with due date falling 10 days after challan download, preserving scholarships and sibling discounts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-white/10 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Current Cycle Status:</div>
                <div className="text-xs font-bold text-indigo-200">
                  {cronStatus?.currentMonth || 'Current Month'}: {cronStatus?.currentMonthChallansCount || 0} / {cronStatus?.totalActiveStudents || students.length} Students
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                Generate Monthly Challans
              </button>
            </div>
          </div>
        </div>
  )
}
