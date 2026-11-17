import React from 'react'
import { Building } from 'lucide-react'

/** Section 1: institution header and signatories. */
export default function ChallanIdentitySection({
  setChallanConfig,
  safeChallanConfig,
  mergeChallanConfig,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            1. School Identity & Header Branding
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            Customize the official school name, challan sub-title, and signatory titles printed across each voucher panel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase mb-1">
                Institution Name (Top Banner)
              </label>
              <input aria-label="Institution Name (Top Banner)"
                type="text"
                value={safeChallanConfig.instituteName || ''}
                onChange={(e) =>
                  setChallanConfig((prev) => ({
                    ...mergeChallanConfig(prev),
                    instituteName: e.target.value,
                  }))
                }
                placeholder="e.g. AL-HAQ MODEL ACADEMY & COLLEGE"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase mb-1">
                Challan Sub-Header
              </label>
              <input aria-label="Challan Sub-Header"
                type="text"
                value={safeChallanConfig.subHeader || ''}
                onChange={(e) =>
                  setChallanConfig((prev) => ({
                    ...mergeChallanConfig(prev),
                    subHeader: e.target.value,
                  }))
                }
                placeholder="e.g. BANK & DIGITAL PAYMENT FEE CHALLAN - ACADEMIC 2026"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase mb-2">
              Signatory Titles (Printed at footer of each copy)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">Left Signatory</label>
                <input aria-label="Left Signatory"
                  type="text"
                  value={safeChallanConfig.signatories?.leftTitle || ''}
                  onChange={(e) =>
                    setChallanConfig((prev) => ({
                      ...mergeChallanConfig(prev),
                      signatories: {
                        ...prev.signatories,
                        leftTitle: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">Middle Signatory</label>
                <input aria-label="Middle Signatory"
                  type="text"
                  value={safeChallanConfig.signatories?.middleTitle || ''}
                  onChange={(e) =>
                    setChallanConfig((prev) => ({
                      ...mergeChallanConfig(prev),
                      signatories: {
                        ...prev.signatories,
                        middleTitle: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-0.5">Right Signatory</label>
                <input aria-label="Right Signatory"
                  type="text"
                  value={safeChallanConfig.signatories?.rightTitle || ''}
                  onChange={(e) =>
                    setChallanConfig((prev) => ({
                      ...mergeChallanConfig(prev),
                      signatories: {
                        ...prev.signatories,
                        rightTitle: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
  )
}
