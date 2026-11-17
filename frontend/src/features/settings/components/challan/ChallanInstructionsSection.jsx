import React from 'react'
import { Trash2, CheckCircle2 } from 'lucide-react'
import Button from '../../../../components/ui/Button'

/** Section 6 of the challan builder: printable instructions. */
export default function ChallanInstructionsSection({
  setChallanConfig,
  safeChallanConfig,
  newInstructionText,
  setNewInstructionText,
  mergeChallanConfig,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            6. Printable Payment Instructions & Terms
          </h3>
          {safeChallanConfig.instructions.length === 0 ? (
            <div className="py-6 px-4 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 mb-4">
              <CheckCircle2 className="w-6 h-6 mx-auto text-gray-500 dark:text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No Printable Payment Terms or Instructions</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                All printable terms have been deleted. Add a custom instruction line below if desired.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {safeChallanConfig.instructions.map((inst, index) => (
                <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-gray-500 dark:text-slate-400">{index + 1}.</span>
                  <input
                    aria-label={`Instruction ${index + 1}`}
                    type="text"
                    value={inst}
                    onChange={(e) => {
                      const updated = [...safeChallanConfig.instructions]
                      updated[index] = e.target.value
                      setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), instructions: updated }))
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-slate-200 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = safeChallanConfig.instructions.filter((_, idx) => idx !== index)
                      setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), instructions: updated }))
                    }}
                    className="text-gray-500 dark:text-slate-400 hover:text-rose-600 p-1"
                    aria-label={`Delete instruction ${index + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input aria-label="Enter new instruction line (e.g. 5. Contact accounts desk for online verification)."
              type="text"
              placeholder="Enter new instruction line (e.g. 5. Contact accounts desk for online verification)."
              value={newInstructionText}
              onChange={(e) => setNewInstructionText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                if (newInstructionText.trim()) {
                  setChallanConfig((prev) => {
                    const base = mergeChallanConfig(prev)
                    return {
                      ...base,
                      instructions: [...base.instructions, newInstructionText.trim()],
                    }
                  })
                  setNewInstructionText('')
                }
              }}
            >
              Add Line
            </Button>
          </div>
        </div>
  )
}
