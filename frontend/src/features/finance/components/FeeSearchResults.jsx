import React from 'react'
import { ArrowLeft, Search, FileText } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'

/** Global search results of the Finance page. */
export default function FeeSearchResults({
  columns,
  searchedFees,
  searchColumns,
  loading,
  searchQuery,
  setSearchQuery,
}) {
  return (
          <div className="space-y-4">
            <div className="card-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Search Results
                  </h3>
                  <Badge variant="indigo">{searchedFees.length} Found</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fee accounts & challan vouchers matching &ldquo;{searchQuery}&rdquo; across all academic grades
                </p>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Grade View
              </button>
            </div>

            <DataTable
              columns={searchColumns}
              data={searchedFees}
              loading={loading}
              emptyMessage={`No student fee records or challans found matching "${searchQuery}".`}
            />
          </div>
  )
}
