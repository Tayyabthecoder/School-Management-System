import React from 'react'
import { Trash2, Plus, FileSpreadsheet } from 'lucide-react'
import Button from '../../../../components/ui/Button'

/** Section 5: fee heads and amounts. */
export default function ChallanFeeHeadsSection({
  setChallanConfig,
  safeChallanConfig,
  onOpenAddParticular,
  mergeChallanConfig,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                5. Fee Heads & Line Items Table
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Configure fee heads and default amounts displayed in the fee breakdown table.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenAddParticular}
            >
              Add Fee Head
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
              <div className="col-span-4">Particular / Head Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Default Amount (PKR)</div>
              <div className="col-span-2 text-center">Active Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {safeChallanConfig.particulars.map((part, index) => (
                <div key={part.id || index} className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-gray-50 dark:hover:bg-slate-800/30 text-xs">
                  <div className="col-span-4 font-semibold text-gray-900 dark:text-white">{part.name}</div>
                  <div className="col-span-2">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-gray-700 dark:text-slate-300 capitalize font-medium text-[11px]">
                      {part.type}
                    </span>
                  </div>
                  <div className="col-span-3 pr-4">
                    <div className="relative">
                      <input
                        aria-label={`Default amount for ${part.name}`}
                        type="number"
                        min="0"
                        value={part.defaultAmount !== undefined ? part.defaultAmount : 0}
                        onChange={(e) => {
                          const updated = [...safeChallanConfig.particulars]
                          updated[index] = { ...updated[index], defaultAmount: Number(e.target.value) || 0 }
                          setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), particulars: updated }))
                        }}
                        className="w-full px-2.5 py-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-500 dark:text-slate-400 font-semibold pointer-events-none">
                        PKR
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <input
                      aria-label={`Include ${part.name} on the challan`}
                      type="checkbox"
                      checked={part.isEnabled}
                      onChange={(e) => {
                        const updated = [...safeChallanConfig.particulars]
                        updated[index] = { ...updated[index], isEnabled: e.target.checked }
                        setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), particulars: updated }))
                      }}
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-gray-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {part.type !== 'tuition' && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = safeChallanConfig.particulars.filter((_, idx) => idx !== index)
                          setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), particulars: updated }))
                        }}
                        className="text-gray-500 dark:text-slate-400 hover:text-rose-600 p-1"
                        title="Delete fee head"
                        aria-label={`Delete fee head ${part.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Late Fee Surcharge Amount (PKR)
            </label>
            <div className="relative">
              <input aria-label="Late Fee Surcharge Amount (PKR)"
                type="number"
                min="0"
                value={safeChallanConfig.lateFeeSurcharge}
                onChange={(e) =>
                  setChallanConfig((prev) => ({
                    ...mergeChallanConfig(prev),
                    lateFeeSurcharge: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 dark:text-slate-400 font-bold pointer-events-none">
                PKR
              </span>
            </div>
          </div>
        </div>
  )
}
