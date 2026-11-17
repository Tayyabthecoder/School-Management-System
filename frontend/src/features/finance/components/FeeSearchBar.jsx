import React from 'react'
import { Search, X } from 'lucide-react'

/** Search box and filters at the top of the Finance page. */
export default function FeeSearchBar({
  searchedFees,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) {
  return (
        <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
              <input aria-label="Search any student by name, student ID (e.g. STU-0012), or challan # (e.g. CHL-2026-ABCDEF)..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any student by name, student ID (e.g. STU-0012), or challan # (e.g. CHL-2026-ABCDEF)..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
              {['All', 'Pending', 'Partial', 'Overdue', 'Paid'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Active Indicator / Summary */}
          {searchQuery.trim() && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Found <strong className="text-indigo-600 dark:text-indigo-400">{searchedFees.length}</strong> record{searchedFees.length === 1 ? '' : 's'} matching &ldquo;<span className="text-slate-800 dark:text-slate-200 font-semibold">{searchQuery}</span>&rdquo;
                {statusFilter !== 'All' && <span> with status <strong>{statusFilter}</strong></span>}
              </span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('All')
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>
  )
}
