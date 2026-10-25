import React, { useState } from 'react'
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
import { useToastStore } from '../../../store/toastStore'

// Preset sample student profiles for interactive preview verification
const SAMPLE_STUDENTS = {
  ali: {
    id: 'ali',
    name: 'Muhammad Ali Khan',
    studentId: 'STU-2026-0042',
    classGrade: 'Grade 10',
    section: 'A',
    guardian: 'Tariq Mehmood Khan',
    challanNo: 'CHL-2026-0429',
    issueDate: '01/09/2026',
    dueDate: '10/09/2026',
    month: 'September 2026',
    concessionLabel: 'Sibling Concession (25%)',
    concessionPct: 0.25,
  },
  fatima: {
    id: 'fatima',
    name: 'Fatima Zahra',
    studentId: 'STU-2026-0088',
    classGrade: 'Grade 9',
    section: 'B',
    guardian: 'Syed Zahid Hussain',
    challanNo: 'CHL-2026-0430',
    issueDate: '01/09/2026',
    dueDate: '10/09/2026',
    month: 'September 2026',
    concessionLabel: 'Merit Scholarship (50%)',
    concessionPct: 0.5,
  },
  hassan: {
    id: 'hassan',
    name: 'Hassan Raza',
    studentId: 'STU-2026-0115',
    classGrade: 'Grade 6',
    section: 'A',
    guardian: 'Raza Ahmad Farooqi',
    challanNo: 'CHL-2026-0431',
    issueDate: '01/09/2026',
    dueDate: '10/09/2026',
    month: 'September 2026',
    concessionLabel: 'No Concession (Standard)',
    concessionPct: 0,
  },
}

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
  const toast = useToastStore()

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
      {/* Print CSS for clean A4 voucher printout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-challan-voucher, #printable-challan-voucher * {
            visibility: visible !important;
          }
          #printable-challan-voucher {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
        }
      `}</style>
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
              onClick={() => {
                if (window.confirm('Reset all challan settings to standard 3-part defaults?')) {
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
            <input
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
            <input
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
              <input
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
              <input
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
              <input
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
                  <input
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
                  <input
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
            <CreditCard className="w-8 h-8 mx-auto text-gray-400 mb-2" />
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
                        <span className="text-[10px] font-semibold uppercase text-gray-400 dark:text-slate-500">{pm.type}</span>
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
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Remove channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-slate-500">Account / Till:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{pm.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 dark:text-slate-500">Title:</span>
                      <span className="text-gray-700 dark:text-slate-300">{pm.accountTitle}</span>
                    </div>
                    {pm.branchCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-slate-500">Branch Code:</span>
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
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-gray-400 font-semibold pointer-events-none">
                      PKR
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <input
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
                      className="text-gray-400 hover:text-rose-600 p-1"
                      title="Delete fee head"
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
            <input
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
            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold pointer-events-none">
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
            <CheckCircle2 className="w-6 h-6 mx-auto text-gray-400 mb-1" />
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No Printable Payment Terms or Instructions</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              All printable terms have been deleted. Add a custom instruction line below if desired.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {safeChallanConfig.instructions.map((inst, index) => (
              <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-gray-400">{index + 1}.</span>
                <input
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
                  className="text-gray-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
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

      {/* Section 6: Real-time Live Visual Preview (A4 Landscape) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                7. Live Real-Time Voucher Preview (A4 Landscape)
              </h3>
              <Badge variant="indigo">
                {safeChallanConfig.layout === '2-part'
                  ? '2-Part Dual-Copy'
                  : '3-Part Standard'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Preview of the printable fee voucher.
            </p>
          </div>

          {/* Interactive Preview Controls Toolbar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Sample Student Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold">Test Profile:</span>
              <select
                value={sampleStudentKey}
                onChange={(e) => setSampleStudentKey(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ali" className="text-gray-900 bg-white">Ali Khan (25% Sibling Discount)</option>
                <option value="fatima" className="text-gray-900 bg-white">Fatima Zahra (50% Merit Aid)</option>
                <option value="hassan" className="text-gray-900 bg-white">Hassan Raza (Full Fee / No Concession)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Calculation Summary Banner */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">Active Heads Total</span>
            <p className="font-bold text-gray-900 dark:text-white">PKR {grossFee.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
              Concession ({sampleStudent.concessionLabel.split(' ')[0]})
            </span>
            <p className="font-bold text-emerald-700 dark:text-emerald-400">- PKR {calculatedDiscount.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Net Within Due Date</span>
            <p className="font-bold text-indigo-700 dark:text-indigo-300">PKR {netPayable.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">After Due Date (+{lateSurcharge})</span>
            <p className="font-bold text-rose-700 dark:text-rose-400">PKR {grossPayableAfterDue.toLocaleString()}</p>
          </div>
        </div>

        {/* The Voucher Canvas Container */}
        <div className="p-4 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-x-auto shadow-inner">
          <div
            id="printable-challan-voucher"
            className={`${
              safeChallanConfig.layout === '2-part'
                ? 'min-w-[680px]'
                : 'min-w-[760px]'
            } bg-white p-4 rounded-xl border border-gray-300 shadow-2xl text-[10px] mx-auto`}
          >
            {/* Side-by-side Multi-Copy Grid */}
            <div
              className={`grid ${
                safeChallanConfig.layout === '2-part'
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              } gap-3`}
            >
              {visibleCopies.map((copy, index) => {
                const badgeColor = copy?.badgeColor || '#1E3A8A'

                return (
                  <div
                    key={index}
                    className="border border-gray-300 rounded-lg overflow-hidden flex flex-col justify-between bg-white relative shadow-xs"
                  >
                    {/* Top School Header */}
                    <div className="p-2.5 text-white text-center shadow-xs" style={{ backgroundColor: badgeColor }}>
                      <p className="font-extrabold text-[9.5px] uppercase tracking-wider leading-tight">
                        {safeChallanConfig.instituteName || 'SCHOOL MANAGEMENT SYSTEM'}
                      </p>
                      <p className="text-[7px] font-medium opacity-90 mt-0.5">
                        {safeChallanConfig.subHeader || 'BANK & DIGITAL PAYMENT FEE CHALLAN'}
                      </p>
                    </div>

                    {/* Copy Identifier Banner */}
                    <div className="bg-slate-50 py-1.5 px-2 text-center border-b border-gray-200">
                      <p className="font-bold text-[9px] tracking-wide" style={{ color: badgeColor }}>
                        {(copy?.name || `COPY #${index + 1}`).toUpperCase()}
                      </p>
                      <p className="text-[7px] text-gray-500">{copy?.subtitle || ''}</p>
                    </div>

                    <div className="p-2 space-y-2 flex-1 flex flex-col">
                      {/* Bank & Digital Accounts Box */}
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-[8px]">
                        {activePayments.length === 0 ? (
                          <div className="text-amber-800 bg-amber-50/80 p-1.5 rounded text-[7px] text-center font-medium border border-amber-200">
                            ⚠️ No payment channels currently enabled
                          </div>
                        ) : (
                          <>
                            {activeBanks.length > 0 ? (
                              activeBanks.map((b, bi) => (
                                <div key={bi} className="space-y-0.5">
                                  <p className="font-bold text-gray-900 truncate flex items-center gap-1">
                                    <span>🏦</span> {b.name}
                                  </p>
                                  <p className="text-gray-600 truncate text-[7.5px]">
                                    <span className="font-semibold text-gray-400">A/C:</span> {b.accountNumber}
                                    {b.accountTitle && <span className="text-gray-500 font-normal"> ({b.accountTitle})</span>}
                                  </p>
                                  {b.branchCode && (
                                    <p className="text-gray-500 text-[7px] truncate">
                                      Branch: {b.branchCode} {b.branchName ? `· ${b.branchName}` : ''}
                                    </p>
                                  )}
                                </div>
                              ))
                            ) : null}

                            {activeDigital.length > 0 && (
                              <div className={`${activeBanks.length > 0 ? 'pt-1 border-t border-slate-200' : ''} space-y-0.5`}>
                                <span className="font-bold text-emerald-800 text-[7.5px] flex items-center gap-1">
                                  <span>⚡</span> Digital Wallets & Raast:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {activeDigital.map((d, di) => (
                                    <span
                                      key={di}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[7px]"
                                    >
                                      {d.name}: {d.accountNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Metadata & Student Demographics Box */}
                      <div className="p-1.5 bg-white rounded border border-gray-200 text-[7.5px] space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Challan #:</span>
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1 rounded">
                            {sampleStudent.challanNo}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Issue Date:</span>
                          <span className="font-medium text-gray-700">{sampleStudent.issueDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-rose-700">Due Date:</span>
                          <span className="font-bold text-rose-700 bg-rose-50 px-1 rounded border border-rose-200">
                            {sampleStudent.dueDate}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Month:</span>
                          <span className="font-semibold text-gray-800">{sampleStudent.month}</span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5 border-t border-gray-100">
                          <span className="text-gray-500">Student:</span>
                          <span className="font-bold text-gray-900 truncate max-w-[130px]">
                            {sampleStudent.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Student ID / Roll:</span>
                          <span className="font-mono font-semibold text-indigo-700">{sampleStudent.studentId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Class & Sec:</span>
                          <span className="font-semibold text-gray-800">
                            {sampleStudent.classGrade} - {sampleStudent.section}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Guardian:</span>
                          <span className="text-gray-700 truncate max-w-[130px]">{sampleStudent.guardian}</span>
                        </div>
                      </div>

                      {/* Line Items & Particulars Table */}
                      <div className="border border-gray-200 rounded overflow-hidden text-[7.5px]">
                        <div
                          className="p-1 text-white font-bold flex justify-between uppercase tracking-wider"
                          style={{ backgroundColor: badgeColor }}
                        >
                          <span>Particular / Head</span>
                          <span>Amount (PKR)</span>
                        </div>

                        {displayParticulars.length > 0 ? (
                          displayParticulars.map((part, pi) => (
                            <div
                              key={pi}
                              className="p-1 bg-white flex justify-between border-b border-gray-100 text-gray-800"
                            >
                              <span className="truncate max-w-[130px]">{part.name}</span>
                              <span className="font-mono font-medium">
                                {Number(part.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-1 bg-white flex justify-between border-b border-gray-100 text-gray-800">
                            <span>Monthly Tuition Fee</span>
                            <span className="font-mono font-medium">{tuitionAmount.toLocaleString()}</span>
                          </div>
                        )}

                        {/* Concession / Scholarship if applicable */}
                        {calculatedDiscount > 0 && (
                          <div className="p-1 bg-emerald-50 flex justify-between border-b border-emerald-100 text-emerald-800 font-semibold">
                            <span className="truncate max-w-[130px]">{sampleStudent.concessionLabel}</span>
                            <span className="font-mono">- {calculatedDiscount.toLocaleString()}</span>
                          </div>
                        )}

                        {/* NET PAYABLE */}
                        <div className="p-1 bg-indigo-50 font-bold flex justify-between text-indigo-950 border-b border-indigo-200">
                          <span>NET PAYABLE (Within Due Date)</span>
                          <span className="font-mono">PKR {netPayable.toLocaleString()}</span>
                        </div>

                        {/* Late Surcharge */}
                        <div className="p-1 bg-white flex justify-between border-b border-gray-100 text-rose-700">
                          <span>Late Surcharge (After Due Date)</span>
                          <span className="font-mono font-medium">+ {lateSurcharge.toLocaleString()}</span>
                        </div>

                        {/* Gross Amount After Due Date */}
                        <div className="p-1 bg-rose-50 font-bold flex justify-between text-rose-900">
                          <span>TOTAL PAYABLE (After Due Date)</span>
                          <span className="font-mono">PKR {grossPayableAfterDue.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Printable Instructions Box */}
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[6.5px] text-gray-600 space-y-0.5">
                        <p className="font-bold text-[7px] text-gray-700 uppercase">Payment Instructions:</p>
                        {instructionsList.length > 0 ? (
                          instructionsList.slice(0, 5).map((inst, i) => (
                            <p key={i} className="truncate">
                              {inst}
                            </p>
                          ))
                        ) : (
                          <p className="italic text-gray-400">No payment instructions configured.</p>
                        )}
                      </div>

                      {/* Barcode & Challan Serial Box */}
                      <div className="pt-1 mt-auto flex items-center justify-between border-t border-dashed border-gray-200">
                        <div className="flex gap-[1.5px] items-center h-3.5">
                          {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1].map((w, bi) => (
                            <span key={bi} className="h-full bg-slate-800" style={{ width: `${w}px` }} />
                          ))}
                        </div>
                        <span className="font-mono text-[7px] text-slate-500 font-bold">
                          {sampleStudent.challanNo}
                        </span>
                      </div>
                    </div>

                    {/* Official Signatures Footer */}
                    <div className="p-2 border-t border-gray-200 bg-slate-50 flex justify-between text-[6.5px] text-gray-600">
                      <div className="text-center">
                        <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                        <span className="truncate block max-w-[70px]">{leftSig}</span>
                      </div>
                      {middleSig && (
                        <div className="text-center">
                          <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                          <span className="truncate block max-w-[70px]">{middleSig}</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="border-b border-gray-400 w-16 mb-0.5 mx-auto"></div>
                        <span className="truncate block max-w-[70px]">{rightSig}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
