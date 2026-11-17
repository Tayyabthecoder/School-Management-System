import React, { useState } from 'react'
import { confirmAction } from '../../../store/confirmStore'
import {
  Receipt,
  Save,
  Layers,
  Palette,
  CreditCard,
  Building,
  Smartphone,
  Zap,
  Trash2,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Eye,
  UserCheck,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { useToast } from '../../../store/toastStore'
import ChallanVoucherPreview from './ChallanVoucherPreview'
import { SAMPLE_STUDENTS } from './challanSampleStudents'


export default function ChallanBuilderTab({
  challanConfig,
  setChallanConfig,
  safeChallanConfig,
  savingChallan,
  onSaveChallanConfig,
  onOpenAddPayment,
  onOpenAddParticular,
  newInstructionText,
  setNewInstructionText,
  DEFAULT_CHALLAN_CONFIG,
  mergeChallanConfig,
}) {
  const toast = useToast()

  // Interactive preview state
  const [sampleStudentKey, setSampleStudentKey] = useState('ali')

  // Current sample student selection
  const sampleStudent = SAMPLE_STUDENTS[sampleStudentKey] || SAMPLE_STUDENTS.ali

  // Synchronized active visible copies matching layout
  const targetCopyCount = safeChallanConfig.layout === '2-part' ? 2 : 3
  const visibleCopies = (safeChallanConfig.copies || []).slice(0, targetCopyCount)

  // Fee head computation with accurate custom tuition fee reflection
  const allParticulars = safeChallanConfig.particulars || []
  const activeParticulars = allParticulars.filter((p) => p?.isEnabled)
  const tuitionHead = activeParticulars.find((p) => p?.type === 'tuition')
  const tuitionAmount = tuitionHead ? (Number(tuitionHead.defaultAmount) || 0) : 0

  const displayParticulars = activeParticulars.map((p) => ({
    id: p.id,
    name: p.name,
    amount: Number(p.defaultAmount) || 0,
  }))

  const grossFee = displayParticulars.reduce((sum, p) => sum + p.amount, 0)
  const calculatedDiscount = Math.round(tuitionAmount * (sampleStudent.concessionPct || 0))
  const netPayable = Math.max(0, grossFee - calculatedDiscount)
  const lateSurcharge =
    typeof safeChallanConfig.lateFeeSurcharge === 'number'
      ? safeChallanConfig.lateFeeSurcharge
      : 500
  const grossPayableAfterDue = netPayable + lateSurcharge

  // Filter active payment methods
  const activePayments = (safeChallanConfig.paymentMethods || []).filter((p) => p?.isEnabled)
  const activeBanks = activePayments.filter((p) => p?.type === 'bank')
  const activeDigital = activePayments.filter((p) => p?.type !== 'bank')

  // Printable instructions list (respecting empty array when all deleted)
  const instructionsList = Array.isArray(safeChallanConfig.instructions)
    ? safeChallanConfig.instructions
    : DEFAULT_CHALLAN_CONFIG.instructions

  // Signatory labels
  const leftSig = safeChallanConfig.signatories?.leftTitle || 'Depositor / Student Sign'
  const middleSig = safeChallanConfig.signatories?.middleTitle || 'Accounts Officer'
  const rightSig = safeChallanConfig.signatories?.rightTitle || 'Bank / Cashier Stamp'

  return (
    <div className="space-y-6">
      {/* Header Action Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> PDF Voucher Engine
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              Fee Challan & Multi-Channel Payment Settings
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Configure 2-part or 3-part layout, copy names, banking & digital wallets (Easypaisa, JazzCash, Raast), fee heads table, and printable instructions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (await confirmAction({ title: 'Reset challan settings', message: 'Reset all challan settings to standard 3-part defaults?', confirmLabel: 'Reset', danger: true })) {
                  setChallanConfig(DEFAULT_CHALLAN_CONFIG)
                  toast.info('Challan settings reset to standard defaults.')
                }
              }}
            >
              Reset Defaults
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              loading={savingChallan}
              onClick={onSaveChallanConfig}
            >
              {savingChallan ? 'Saving Changes…' : 'Save Challan Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 1: Institution Header & Signatories Identity */}
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

      {/* Section 2: Layout Selection */}
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

      {/* Section 3: Customize Copy Names & Colors */}
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

      {/* Section 4: Multi-Channel Payment Methods */}
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
            <CreditCard className="w-8 h-8 mx-auto text-gray-500 mb-2" />
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
                        <span className="text-[10px] font-semibold uppercase text-gray-500 dark:text-slate-500">{pm.type}</span>
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
                        className="text-gray-500 hover:text-rose-600 p-1"
                        title="Remove channel"
                        aria-label="Remove payment channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-slate-500">Account / Till:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{pm.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-slate-500">Title:</span>
                      <span className="text-gray-700 dark:text-slate-300">{pm.accountTitle}</span>
                    </div>
                    {pm.branchCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-500">Branch Code:</span>
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

      {/* Section 5: Fee Heads & Line Items Table */}
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
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-500 font-semibold pointer-events-none">
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
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
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
                      className="text-gray-500 hover:text-rose-600 p-1"
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
            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-bold pointer-events-none">
              PKR
            </span>
          </div>
        </div>
      </div>

      {/* Section 6: Printable Instructions & Policies */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          6. Printable Payment Instructions & Terms
        </h3>
        {safeChallanConfig.instructions.length === 0 ? (
          <div className="py-6 px-4 text-center bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 mb-4">
            <CheckCircle2 className="w-6 h-6 mx-auto text-gray-500 mb-1" />
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No Printable Payment Terms or Instructions</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              All printable terms have been deleted. Add a custom instruction line below if desired.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {safeChallanConfig.instructions.map((inst, index) => (
              <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-gray-500">{index + 1}.</span>
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
                  className="text-gray-500 hover:text-rose-600 p-1"
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

      <ChallanVoucherPreview
        safeChallanConfig={safeChallanConfig}
        sampleStudent={sampleStudent}
        visibleCopies={visibleCopies}
        tuitionAmount={tuitionAmount}
        displayParticulars={displayParticulars}
        grossFee={grossFee}
        calculatedDiscount={calculatedDiscount}
        netPayable={netPayable}
        lateSurcharge={lateSurcharge}
        grossPayableAfterDue={grossPayableAfterDue}
        activePayments={activePayments}
        activeBanks={activeBanks}
        activeDigital={activeDigital}
        instructionsList={instructionsList}
        leftSig={leftSig}
        middleSig={middleSig}
        rightSig={rightSig}
        sampleStudentKey={sampleStudentKey}
        setSampleStudentKey={setSampleStudentKey}
      />
    </div>
  )
}
