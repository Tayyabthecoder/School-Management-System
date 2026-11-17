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
import ChallanInstructionsSection from './challan/ChallanInstructionsSection'
import ChallanFeeHeadsSection from './challan/ChallanFeeHeadsSection'
import ChallanPaymentMethodsSection from './challan/ChallanPaymentMethodsSection'
import ChallanCopyStyleSection from './challan/ChallanCopyStyleSection'
import ChallanLayoutSection from './challan/ChallanLayoutSection'
import ChallanIdentitySection from './challan/ChallanIdentitySection'


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
      <ChallanIdentitySection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        mergeChallanConfig={mergeChallanConfig}
      />

      {/* Section 2: Layout Selection */}
      <ChallanLayoutSection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        DEFAULT_CHALLAN_CONFIG={DEFAULT_CHALLAN_CONFIG}
        mergeChallanConfig={mergeChallanConfig}
      />

      {/* Section 3: Customize Copy Names & Colors */}
      <ChallanCopyStyleSection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        mergeChallanConfig={mergeChallanConfig}
        visibleCopies={visibleCopies}
      />

      {/* Section 4: Multi-Channel Payment Methods */}
      <ChallanPaymentMethodsSection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        onOpenAddPayment={onOpenAddPayment}
        mergeChallanConfig={mergeChallanConfig}
      />

      {/* Section 5: Fee Heads & Line Items Table */}
      <ChallanFeeHeadsSection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        onOpenAddParticular={onOpenAddParticular}
        mergeChallanConfig={mergeChallanConfig}
      />

      {/* Section 6: Printable Instructions & Policies */}
      <ChallanInstructionsSection
        setChallanConfig={setChallanConfig}
        safeChallanConfig={safeChallanConfig}
        newInstructionText={newInstructionText}
        setNewInstructionText={setNewInstructionText}
        mergeChallanConfig={mergeChallanConfig}
      />

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
