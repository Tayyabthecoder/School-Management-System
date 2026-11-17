import React from 'react'
import { ArrowLeft, Printer } from 'lucide-react'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import GradeSectionNavigator from '../../../components/ui/GradeSectionNavigator'

/** Level 3 of the Finance page: the fee ledger table of one section. */
export default function FeeLedgerView({
  displayClasses,
  handleSelectSection,
  handleBulkPrintChallans,
  activeFeeLedger,
  columns,
  getSectionsForGrade,
  students,
  loading,
  setNavLevel,
  selectedGrade,
  setSelectedGrade,
  selectedSection,
  setSelectedSection,
  bulkPrinting,
  bulkProgress,
}) {
  return (
          <div>
            <GradeSectionNavigator
              grades={displayClasses}
              selectedGrade={selectedGrade}
              selectedSection={selectedSection}
              onSelectGrade={(g) => {
                setSelectedGrade(g)
                const secs = getSectionsForGrade(g)
                setSelectedSection(secs.includes(selectedSection) ? selectedSection : (secs[0] || 'A'))
              }}
              onSelectSection={(sec) => handleSelectSection(sec)}
              students={students}
              rightSlot={
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Printer}
                    loading={bulkPrinting}
                    onClick={handleBulkPrintChallans}
                  >
                    {bulkPrinting ? (bulkProgress || 'Generating...') : 'Bulk Print Section Challans'}
                  </Button>
                  <button
                    onClick={() => setNavLevel('grades')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> All Grades
                  </button>
                </div>
              }
            />

            <div className="card-surface p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {selectedGrade.name} · SECTION {selectedSection}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Fee Balance & Concession Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official printable Bank Fee Challan vouchers (configurable 2-part or 3-part in Settings)
                </p>
              </div>
              <Badge variant="indigo">{activeFeeLedger.length} Accounts Active</Badge>
            </div>

            <DataTable
              columns={columns}
              data={activeFeeLedger}
              loading={loading}
              emptyMessage={`No student fee records found for ${selectedGrade.name} - Section ${selectedSection}.`}
            />
          </div>
  )
}
