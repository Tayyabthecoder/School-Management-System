import React, { useEffect, useState, useMemo } from 'react'
import { loadClasses } from '../../hooks/useClasses'
import {
  CircleDollarSign,
  Users,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Download,
  Percent,
  Tag,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  Zap,
  Search,
  X,
  FileText,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GradeSectionNavigator from '../../components/ui/GradeSectionNavigator'
import api from '../../lib/axios'
import { formatPKR } from '../../lib/formatters'

import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'
import { useToast } from '../../store/toastStore'
import {
  RecordPaymentModal,
  ApplyConcessionModal,
  GenerateMonthlyChallansModal,
} from './components/FinanceModals'
import { logError } from '../../lib/logger'
import { buildFeeLedgerColumns } from './components/feeLedgerColumns'
import { cachedGet } from '../../lib/cachedGet'
import FeeLedgerView from './components/FeeLedgerView'
import FeeSectionPicker from './components/FeeSectionPicker'
import FeeGradePicker from './components/FeeGradePicker'
import FeeSearchResults from './components/FeeSearchResults'
import FeeSearchBar from './components/FeeSearchBar'
import MonthlyChallanControlCard from './components/MonthlyChallanControlCard'
import { useFeeSearchColumns } from './hooks/useFeeSearchColumns'
import { useChallanActions } from './hooks/useChallanActions'
import { useFeeActions } from './hooks/useFeeActions'
import { useFinanceData } from './hooks/useFinanceData'


export default function FinancePage() {
  const toast = useToast()
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [studentFees, setStudentFees] = useState([])
  const [loading, setLoading] = useState(true)

  const [navLevel, setNavLevel] = useState('grades')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  // Search Bar State (Student Name, Student ID, or Challan #)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Payment Recording State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedFeeRecord, setSelectedFeeRecord] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Concession Modal State
  const [showConcessionModal, setShowConcessionModal] = useState(false)
  const [concessionFeeRecord, setConcessionFeeRecord] = useState(null)
  const [concessionType, setConcessionType] = useState('Sibling Discount')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [concessionReason, setConcessionReason] = useState('')
  const [submittingConcession, setSubmittingConcession] = useState(false)

  // Challan Download Tracker
  const [downloadingChallanId, setDownloadingChallanId] = useState(null)

  // Overdue Banner State
  const [overdueStats, setOverdueStats] = useState({ count: 0, total: 0 })
  const [showOverdueBanner, setShowOverdueBanner] = useState(true)

  // Automated Monthly Challans State
  const [cronStatus, setCronStatus] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatingChallans, setGeneratingChallans] = useState(false)
  const [generationTargetDate, setGenerationTargetDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [forceRegenerate, setForceRegenerate] = useState(false)

  const { fetchData } = useFinanceData({ setClasses, students, setStudents, setStudentFees, setLoading, setOverdueStats, setCronStatus })

  const displayClasses = classes && classes.length > 0 ? classes : FALLBACK_GRADES

  const handleSelectGrade = (cls) => {
    setSelectedGrade(cls)
    setSelectedSection(null)
    setNavLevel('sections')
  }

  const handleSelectSection = async (sec) => {
    setSelectedSection(sec)
    setNavLevel('fees')
    if (selectedGrade?._id) {
      try {
        const [feesRes, stuRes] = await Promise.all([
          cachedGet('/finance/student-fees', { params: { classId: selectedGrade._id, sectionId: sec, limit: 1000 } }).catch(() => null),
          cachedGet('/students', { params: { classId: selectedGrade._id, sectionId: sec, limit: 1000 } }).catch(() => null),
        ])
        if (feesRes?.data?.success && Array.isArray(feesRes.data.data)) {
          setStudentFees((prev) => {
            const map = new Map(prev.map(f => [f._id, f]))
            feesRes.data.data.forEach(f => map.set(f._id, f))
            return Array.from(map.values())
          })
        }
        if (stuRes?.data?.success && Array.isArray(stuRes.data.data)) {
          setStudents((prev) => {
            const map = new Map(prev.map(s => [s._id, s]))
            stuRes.data.data.forEach(s => map.set(s._id, s))
            return Array.from(map.values())
          })
        }
      } catch (_) {
      // ignore fetch error
    }
    }
  }

  // Payment Modal Triggers
  const { handleOpenPayment, handleRecordPayment, handleOpenConcessionModal, handleApplyPresetPercentage, handleApplyConcession } = useFeeActions({ toast, fetchData, setShowPaymentModal, selectedFeeRecord, setSelectedFeeRecord, paymentAmount, setPaymentAmount, paymentMode, setSubmittingPayment, setShowConcessionModal, concessionFeeRecord, setConcessionFeeRecord, concessionType, setConcessionType, discountAmount, setDiscountAmount, concessionReason, setConcessionReason, setSubmittingConcession })
  // Challan Download Trigger
  const { handleDownloadChallan, handleBulkPrintChallans, handleTriggerMonthlyGeneration, activeFeeLedger, bulkPrinting, bulkProgress } = useChallanActions({ toast, fetchData, students, studentFees, selectedGrade, selectedSection, setDownloadingChallanId, setShowGenerateModal, setGeneratingChallans, generationTargetDate, forceRegenerate })

  const columns = buildFeeLedgerColumns({
    onDownloadChallan: handleDownloadChallan,
    onOpenConcession: handleOpenConcessionModal,
    onOpenPayment: handleOpenPayment,
    downloadingChallanId,
  })

  const handleJumpToLedger = (feeRecord) => {
    const student = feeRecord.studentId
    if (!student || !student.classId) return
    const classIdVal = student.classId._id || student.classId
    const targetGrade = (classes && classes.length > 0 ? classes : FALLBACK_GRADES).find(
      (c) =>
        c._id === classIdVal ||
        c.name === student.classId?.name
    )
    if (targetGrade) {
      setSelectedGrade(targetGrade)
      setSelectedSection(student.sectionId || 'A')
      setNavLevel('fees')
      setSearchQuery('')
    }
  }

  const searchedFees = useMemo(() => {
    let list = studentFees
    if (statusFilter && statusFilter !== 'All') {
      list = list.filter((f) => f.status === statusFilter)
    }
    if (!searchQuery.trim()) {
      return list
    }
    const q = searchQuery.trim().toLowerCase()
    const cleanQ = q.replace(/^chl(-\d{4})?-/i, '')

    return list.filter((f) => {
      const student = f.studentId || {}
      const fullName = (student.fullName || '').toLowerCase()
      const studentId = (student.studentId || '').toLowerCase()
      const className = (student.classId?.name || '').toLowerCase()
      const sectionId = (student.sectionId || '').toLowerCase()
      const guardian = (
        student.guardian?.name ||
        student.guardianName ||
        (student.parentGuardians && student.parentGuardians[0]?.fullName) ||
        ''
      ).toLowerCase()

      const feeTitle = (f.feeStructureId?.title || '').toLowerCase()
      const challanSuffix = f._id ? f._id.slice(-6).toLowerCase() : ''
      const fullId = (f._id || '').toLowerCase()
      const activeDueDate = f.effectiveDueDate || f.dueDate || f.createdAt
      const challanYear = activeDueDate ? String(new Date(activeDueDate).getFullYear()) : ''
      const fullChallan = `chl-${challanYear}-${challanSuffix}`

      return (
        fullName.includes(q) ||
        studentId.includes(q) ||
        className.includes(q) ||
        sectionId.includes(q) ||
        guardian.includes(q) ||
        feeTitle.includes(q) ||
        challanSuffix.includes(cleanQ) ||
        fullId.includes(cleanQ) ||
        fullChallan.includes(q)
      )
    })
  }, [studentFees, searchQuery, statusFilter])

  const { searchColumns } = useFeeSearchColumns({ handleOpenPayment, handleOpenConcessionModal, handleDownloadChallan, handleJumpToLedger, downloadingChallanId })

  const getSectionsForGrade = (grade) => {
    if (!grade) return ['A', 'B']
    const definedSections =
      Array.isArray(grade.sections) && grade.sections.length > 0
        ? grade.sections
        : ['A', 'B']
    const studentSections = students
      .filter(
        (s) =>
          s.classId &&
          (s.classId._id === grade._id ||
            s.classId === grade._id ||
            s.classId?.name === grade.name)
      )
      .map((s) => s.sectionId)
      .filter(Boolean)
    return Array.from(new Set([...definedSections, ...studentSections])).sort()
  }

  const sectionsToDisplay = getSectionsForGrade(selectedGrade)

  return (
    <div>
      <Breadcrumb
        title="Fee & Finance Management"
        subtitle="Automated 1st-of-month challan generation, grade fee ledgers, and concession management."
      />

      {/* Automated Monthly Recurring Challan Control Card */}
      <MonthlyChallanControlCard
        students={students}
        cronStatus={cronStatus}
        setShowGenerateModal={setShowGenerateModal}
      />

      {showOverdueBanner && overdueStats.count > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 dark:from-rose-950/40 to-red-50 dark:to-red-950/40 border border-red-200 dark:border-red-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">
                Overdue Fee Notice: {overdueStats.count} Student{overdueStats.count > 1 ? 's' : ''} have unpaid fees past deadline
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Total outstanding overdue amount across all classes: <span className="font-bold">{formatPKR(overdueStats.total)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOverdueBanner(false)}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Global Student & Challan Search Bar */}
      <FeeSearchBar
        searchedFees={searchedFees}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Main Content: Search Results OR Navigation Views */}
      {searchQuery.trim().length > 0 ? (
        <FeeSearchResults
          columns={columns}
          searchedFees={searchedFees}
          searchColumns={searchColumns}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      ) : (
        <>
          {navLevel === 'grades' && (
        <FeeGradePicker
          displayClasses={displayClasses}
          handleSelectGrade={handleSelectGrade}
          getSectionsForGrade={getSectionsForGrade}
          students={students}
          studentFees={studentFees}
        />
      )}

      {navLevel === 'sections' && selectedGrade && (
        <FeeSectionPicker
          handleSelectSection={handleSelectSection}
          sectionsToDisplay={sectionsToDisplay}
          students={students}
          setNavLevel={setNavLevel}
          selectedGrade={selectedGrade}
        />
      )}

      {navLevel === 'fees' && selectedGrade && selectedSection && (
        <FeeLedgerView
          displayClasses={displayClasses}
          handleSelectSection={handleSelectSection}
          handleBulkPrintChallans={handleBulkPrintChallans}
          activeFeeLedger={activeFeeLedger}
          columns={columns}
          getSectionsForGrade={getSectionsForGrade}
          students={students}
          loading={loading}
          setNavLevel={setNavLevel}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          bulkPrinting={bulkPrinting}
          bulkProgress={bulkProgress}
        />
      )}
        </>
      )}

      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedFeeRecord={selectedFeeRecord}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMode={paymentMode}
        setPaymentMode={setPaymentMode}
        submittingPayment={submittingPayment}
        onSubmit={handleRecordPayment}
      />

      <ApplyConcessionModal
        isOpen={showConcessionModal}
        onClose={() => setShowConcessionModal(false)}
        concessionFeeRecord={concessionFeeRecord}
        concessionType={concessionType}
        setConcessionType={setConcessionType}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        concessionReason={concessionReason}
        setConcessionReason={setConcessionReason}
        submittingConcession={submittingConcession}
        handleApplyPresetPercentage={handleApplyPresetPercentage}
        onSubmit={handleApplyConcession}
      />

      <GenerateMonthlyChallansModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleTriggerMonthlyGeneration}
        studentsCount={students.length}
        generationTargetDate={generationTargetDate}
        setGenerationTargetDate={setGenerationTargetDate}
        forceRegenerate={forceRegenerate}
        setForceRegenerate={setForceRegenerate}
        generatingChallans={generatingChallans}
      />
    </div>
  )
}

