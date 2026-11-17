import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { formatPKR } from '../../../lib/formatters'

/** Defaulter aging breakdown cards. */
export default function AnalyticsDefaulterAging({
  defaulterAging,
}) {
  return (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      Defaulter Aging Analysis
                    </h2>
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full">
                      Total Outstanding: {formatPKR(defaulterAging?.totalOutstanding || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">0–30 Days Overdue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                        {defaulterAging?.buckets?.['0-30']?.count ?? 0} <span className="text-xs font-normal text-gray-600 dark:text-slate-400">students</span>
                      </p>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">
                        {formatPKR(defaulterAging?.buckets?.['0-30']?.amount || 0)}
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl">
                      <p className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wide">31–60 Days Overdue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                        {defaulterAging?.buckets?.['31-60']?.count ?? 0} <span className="text-xs font-normal text-gray-600 dark:text-slate-400">students</span>
                      </p>
                      <p className="text-xs font-bold text-orange-700 dark:text-orange-300 mt-1">
                        {formatPKR(defaulterAging?.buckets?.['31-60']?.amount || 0)}
                      </p>
                    </div>

                    <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
                      <p className="text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wide">61–90 Days Overdue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                        {defaulterAging?.buckets?.['61-90']?.count ?? 0} <span className="text-xs font-normal text-gray-600 dark:text-slate-400">students</span>
                      </p>
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1">
                        {formatPKR(defaulterAging?.buckets?.['61-90']?.amount || 0)}
                      </p>
                    </div>

                    <div className="p-4 bg-red-100/70 dark:bg-red-950/40 border border-red-300 rounded-xl">
                      <p className="text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wide">90+ Days Critical</p>
                      <p className="text-2xl font-bold text-red-950 dark:text-red-100 mt-1">
                        {defaulterAging?.buckets?.['90+']?.count ?? 0} <span className="text-xs font-normal text-gray-600 dark:text-slate-400">students</span>
                      </p>
                      <p className="text-xs font-bold text-red-700 dark:text-red-300 mt-1">
                        {formatPKR(defaulterAging?.buckets?.['90+']?.amount || 0)}
                      </p>
                    </div>
                  </div>
                </div>
  )
}
