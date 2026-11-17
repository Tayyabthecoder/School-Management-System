import React from 'react'
import { CreditCard, Building, Smartphone, Zap, Trash2, Plus } from 'lucide-react'
import Button from '../../../../components/ui/Button'

/** Section 4: payment channels. */
export default function ChallanPaymentMethodsSection({
  setChallanConfig,
  safeChallanConfig,
  onOpenAddPayment,
  mergeChallanConfig,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                4. Multiple Payment Channels (Banks & Digital Wallets)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Configure commercial bank branches, Easypaisa Till IDs, JazzCash, and Raast instant payment identifiers printed on each challan.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenAddPayment}
            >
              Add Payment Channel
            </Button>
          </div>

          {safeChallanConfig.paymentMethods.length === 0 ? (
            <div className="py-8 px-4 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <CreditCard className="w-8 h-8 mx-auto text-gray-500 dark:text-slate-400 mb-2" />
              <p className="text-xs font-bold text-gray-700 dark:text-slate-300">No Payment Channels Configured</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                All payment channels have been deleted. Click &ldquo;Add Payment Channel&rdquo; above to set up bank branches or mobile wallets.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeChallanConfig.paymentMethods.map((pm, index) => {
                const isBank = pm.type === 'bank'
                const isWallet = pm.type === 'easypaisa' || pm.type === 'jazzcash'
                return (
                  <div
                    key={pm.id || index}
                    className={`p-4 rounded-xl border transition-all ${
                      pm.isEnabled
                        ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm'
                        : 'bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            pm.type === 'bank'
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                              : pm.type === 'easypaisa'
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                              : pm.type === 'jazzcash'
                              ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                              : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {isBank ? <Building className="w-4 h-4" /> : isWallet ? <Smartphone className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{pm.name}</p>
                          <span className="text-[10px] font-semibold uppercase text-gray-500 dark:text-slate-400">{pm.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...safeChallanConfig.paymentMethods]
                            updated[index] = { ...updated[index], isEnabled: !updated[index].isEnabled }
                            setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), paymentMethods: updated }))
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            pm.isEnabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {pm.isEnabled ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = safeChallanConfig.paymentMethods.filter((_, idx) => idx !== index)
                            setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), paymentMethods: updated }))
                          }}
                          className="text-gray-500 dark:text-slate-400 hover:text-rose-600 p-1"
                          title="Remove channel"
                          aria-label="Remove payment channel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Account / Till:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{pm.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">Title:</span>
                        <span className="text-gray-700 dark:text-slate-300">{pm.accountTitle}</span>
                      </div>
                      {pm.branchCode && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">Branch Code:</span>
                          <span className="text-gray-700 dark:text-slate-300">{pm.branchCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
  )
}
