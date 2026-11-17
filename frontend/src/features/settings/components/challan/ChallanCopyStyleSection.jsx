import React from 'react'
import { Palette } from 'lucide-react'
import Badge from '../../../../components/ui/Badge'

/** Section 3: copy names and colours. */
export default function ChallanCopyStyleSection({
  setChallanConfig,
  safeChallanConfig,
  mergeChallanConfig,
  visibleCopies,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            3. Customize Copy Labels & Accent Themes
          </h3>
          <div className={`grid grid-cols-1 ${safeChallanConfig.layout === '2-part' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
            {visibleCopies.map((copy, index) => {
              const PALETTE = ['#1E3A8A', '#065F46', '#581C87', '#C2410C', '#9F1239', '#0F766E', '#0E7490', '#334155']
              return (
                <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Copy #{index + 1}</span>
                    <div
                      className="w-5 h-5 rounded-md shadow-sm border border-black/10"
                      style={{ backgroundColor: copy.badgeColor || '#1E3A8A' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Copy Name</label>
                    <input aria-label="Copy Name"
                      type="text"
                      value={copy.name || ''}
                      onChange={(e) => {
                        const updated = [...safeChallanConfig.copies]
                        updated[index] = { ...updated[index], name: e.target.value }
                        setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), copies: updated }))
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Subtitle / Target</label>
                    <input aria-label="Subtitle / Target"
                      type="text"
                      value={copy.subtitle || ''}
                      onChange={(e) => {
                        const updated = [...safeChallanConfig.copies]
                        updated[index] = { ...updated[index], subtitle: e.target.value }
                        setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), copies: updated }))
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs text-gray-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Accent Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            const updated = [...safeChallanConfig.copies]
                            updated[index] = { ...updated[index], badgeColor: hex }
                            setChallanConfig((prev) => ({ ...mergeChallanConfig(prev), copies: updated }))
                          }}
                          aria-label={`Badge colour ${hex}`}
                          aria-pressed={(copy.badgeColor || '#1E3A8A') === hex}
                          className={`w-6 h-6 rounded-md transition-transform ${
                            (copy.badgeColor || '#1E3A8A') === hex ? 'scale-110 ring-2 ring-indigo-500 ring-offset-1' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
  )
}
