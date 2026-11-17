import React from 'react'
import { Layers } from 'lucide-react'

/** Section 2: layout choice. */
export default function ChallanLayoutSection({
  setChallanConfig,
  safeChallanConfig,
  DEFAULT_CHALLAN_CONFIG,
  mergeChallanConfig,
}) {
  return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            2. Choose Challan Layout
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2-Part Option */}
            <div
              onClick={() => {
                setChallanConfig((prev) => {
                  const base = mergeChallanConfig(prev)
                  const currentCopies = base.copies || []
                  const officeCopy = currentCopies[0] && currentCopies[0].name.toLowerCase().includes('office')
                    ? currentCopies[0]
                    : { name: 'Office Copy', subtitle: '(School Administration & Accounts Record)', badgeColor: '#1E3A8A' }
                  const studentCopy = currentCopies.find((c) => c.name.toLowerCase().includes('student'))
                    || currentCopies[1]
                    || { name: 'Student Copy', subtitle: '(Student & Parent Personal Record)', badgeColor: '#065F46' }
                  return {
                    ...base,
                    layout: '2-part',
                    copies: [
                      { ...officeCopy, name: officeCopy.name || 'Office Copy', subtitle: officeCopy.subtitle || '(School Administration & Accounts Record)', badgeColor: officeCopy.badgeColor || '#1E3A8A' },
                      { ...studentCopy, name: studentCopy.name || 'Student Copy', subtitle: studentCopy.subtitle || '(Student & Parent Personal Record)', badgeColor: studentCopy.badgeColor || '#065F46' },
                    ],
                  }
                })
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                safeChallanConfig.layout === '2-part'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  📋 2-Part Voucher (Office & Student)
                </span>
                {safeChallanConfig.layout === '2-part' && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                Partitioned into 2 copies: Office Copy and Student Copy. Ideal for school counter fee collection and internal accounts reconciliation.
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-center text-[10px] font-bold text-gray-600 dark:text-slate-300">
                <div className="py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded truncate">Office Copy</div>
                <div className="py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded truncate">Student Copy</div>
              </div>
            </div>

            {/* 3-Part Option */}
            <div
              onClick={() => {
                setChallanConfig((prev) => {
                  const base = mergeChallanConfig(prev)
                  return {
                    ...base,
                    layout: '3-part',
                    copies: base.copies.length >= 3 ? base.copies.slice(0, 3) : DEFAULT_CHALLAN_CONFIG.copies,
                  }
                })
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                safeChallanConfig.layout === '3-part'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  📄 3-Part Voucher (Standard)
                </span>
                {safeChallanConfig.layout === '3-part' && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                Partitioned into 3 equal columns: Outer Office Copy, Inner Office Copy, and Student Copy. Ideal for standard bank branch deposit.
              </p>
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-center text-[10px] font-bold text-gray-600 dark:text-slate-300">
                <div className="py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded truncate">Outer Office</div>
                <div className="py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded truncate">Inner Office</div>
                <div className="py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded truncate">Student</div>
              </div>
            </div>
          </div>
        </div>
  )
}
