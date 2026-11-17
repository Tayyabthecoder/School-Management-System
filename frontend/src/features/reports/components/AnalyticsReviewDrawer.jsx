import React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { formatPKR } from '../../../lib/formatters'

/** Slide-over that lists the students needing attention. */
export default function AnalyticsReviewDrawer({
  concessionAnalytics,
  setIsReviewDrawerOpen,
}) {
  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Merit Scholarship Academic Review</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Students receiving merit discounts with academic score below 70% threshold</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto my-4 space-y-3 flex-1 pr-1">
                {(!concessionAnalytics?.flaggedStudents || concessionAnalytics.flaggedStudents.length === 0) ? (
                  <p className="py-8 text-center text-xs text-gray-500 dark:text-slate-400">All merit scholarship recipients currently meet the academic standard.</p>
                ) : (
                  concessionAnalytics.flaggedStudents.map((s, idx) => (
                    <div key={s.studentId || s._id || idx} className="p-4 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">{s.fullName}</span>
                          <span className="font-mono text-[10px] text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded">
                            {s.studentId}
                          </span>
                          <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">{s.className}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-600 dark:text-slate-400">
                            Discount Awarded: <strong className="text-gray-900 dark:text-slate-100">{formatPKR(s.discountAmount)}</strong>
                          </span>
                          <span className="text-gray-600 dark:text-slate-400">
                            Guardian: <strong className="text-gray-900 dark:text-slate-100">{s.guardianPhone || 'N/A'}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border border-rose-300">
                          {s.currentAverage}% Avg
                        </span>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold mt-1">Requires Review</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {concessionAnalytics?.flaggedStudents?.length || 0} candidate(s) flagged for scholarship panel review
                </span>
                <button
                  onClick={() => setIsReviewDrawerOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
  )
}
