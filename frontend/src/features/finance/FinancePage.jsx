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

  const fetchData = async () => {
    setLoading(true)
    try {
      const [clsRes, stuRes, feesRes, statsRes, cronRes] = await Promise.all([
        loadClasses(),
        cachedGet('/students', { params: { limit: 1000 } }),
        cachedGet('/finance/student-fees', { params: { limit: 1000 } }),
        cachedGet('/reports/dashboard-stats').catch(() => ({ data: { data: {} } })),
        cachedGet('/finance/monthly-challans/status').catch(() => ({ data: { data: null } })),
      ])
      if (clsRes.data?.success && clsRes.data.data.length > 0) {
        setClasses(clsRes.data.data)
      } else {
        setClasses(FALLBACK_GRADES)
      }
      if (stuRes.data?.success) setStudents(stuRes.data.data)
      if (feesRes.data?.success) setStudentFees(feesRes.data.data)
      if (statsRes.data?.success) {
        setOverdueStats({
          count: statsRes.data.data?.overdueCount || 0,
          total: statsRes.data.data?.overdueTotal || 0,
        })
      }
      if (cronRes.data?.success) {
        setCronStatus(cronRes.data.data)
      }
    } catch (err) {
      setClasses(FALLBACK_GRADES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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
  const handleOpenPayment = (feeRecord) => {
    setSelectedFeeRecord(feeRecord)
    setPaymentAmount(feeRecord.outstandingAmount || feeRecord.netAmount)
    setShowPaymentModal(true)
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!selectedFeeRecord) return
    setSubmittingPayment(true)

    try {
      const res = await api.post('/finance/payments', {
        studentFeeId: selectedFeeRecord._id,
        amountPaid: Number(paymentAmount),
        paymentMode,
      })

      if (res.data?.success) {
        setShowPaymentModal(false)
        fetchData()
        toast.success(`Payment recorded successfully! Receipt #: ${res.data.data.payment.receiptNo}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Payment recording failed')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Concession Modal Triggers
  const handleOpenConcessionModal = (feeRecord) => {
    setConcessionFeeRecord(feeRecord)
    setConcessionType(
      feeRecord.concessionType && feeRecord.concessionType !== 'None'
        ? feeRecord.concessionType
        : 'Sibling Discount'
    )
    setDiscountAmount(feeRecord.discount || 0)
    setConcessionReason(feeRecord.concessionReason || '')
    setShowConcessionModal(true)
  }

  const handleApplyPresetPercentage = (pct) => {
    if (!concessionFeeRecord) return
    const calculated = Math.round((concessionFeeRecord.amountDue * pct) / 100)
    setDiscountAmount(calculated)
  }

  const handleApplyConcession = async (e) => {
    e.preventDefault()
    if (!concessionFeeRecord) return
    setSubmittingConcession(true)

    try {
      const res = await api.post('/finance/concession', {
        studentFeeId: concessionFeeRecord._id,
        discountAmount: Number(discountAmount),
        concessionType,
        concessionReason,
      })

      if (res.data?.success) {
        setShowConcessionModal(false)
        await fetchData()
        toast.success(`Fee concession applied successfully! New net amount: PKR ${formatPKR(res.data.data.netAmount)}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to apply fee concession')
    } finally {
      setSubmittingConcession(false)
    }
  }

  // Challan Download Trigger
  const handleDownloadChallan = async (feeRecord) => {
    setDownloadingChallanId(feeRecord._id)
    try {
      const res = await api.get(`/finance/challan/${feeRecord._id}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const studentCode = feeRecord.studentId?.studentId || 'STU'
      const challanSuffix = feeRecord._id.slice(-6).toUpperCase()
      link.setAttribute('download', `Fee_Challan_${studentCode}_${challanSuffix}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Refresh data so Due Date column reflects the new 10-day post-download due date immediately
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to download Fee Challan PDF')
    } finally {
      setDownloadingChallanId(null)
    }
  }

  // Bulk Print / Download Section Challans
  const [bulkPrinting, setBulkPrinting] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null)

  const handleBulkPrintChallans = async () => {
    if (!activeFeeLedger || activeFeeLedger.length === 0) {
      toast.warning('No students found in this section to generate challans.')
      return
    }

    setBulkPrinting(true)
    let count = 0
    try {
      for (const feeRecord of activeFeeLedger) {
        setBulkProgress(`Downloading ${count + 1} of ${activeFeeLedger.length}...`)
        const res = await api.get(`/finance/challan/${feeRecord._id}`, {
          responseType: 'blob',
        })
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const studentCode = feeRecord.studentId?.studentId || 'STU'
        const challanSuffix = feeRecord._id.slice(-6).toUpperCase()
        link.setAttribute('download', `Fee_Challan_${studentCode}_${challanSuffix}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
        count++
        await new Promise((r) => setTimeout(r, 150))
      }

      // Refresh data after bulk downloads
      await fetchData()
      toast.success(`Successfully downloaded ${count} fee challans!`)
    } catch (err) {
      logError('Bulk challan error', err)
      toast.error('Failed while downloading bulk challans')
    } finally {
      setBulkPrinting(false)
      setBulkProgress(null)
    }
  }

  const handleTriggerMonthlyGeneration = async (e) => {
    e.preventDefault()
    setGeneratingChallans(true)
    try {
      const res = await api.post('/finance/monthly-challans/generate', {
        targetDate: generationTargetDate,
        force: forceRegenerate,
      })
      if (res.data?.success) {
        setShowGenerateModal(false)
        await fetchData()
        toast.success(
          `Monthly challans generated for ${res.data.data.month} ${res.data.data.year}: ${res.data.data.generatedCount} generated, ${res.data.data.skippedCount} skipped.`
        )
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Failed to generate monthly challans'
      )
    } finally {
      setGeneratingChallans(false)
    }
  }

  const activeFeeLedger = studentFees.filter((f) => {
    if (!selectedGrade || !selectedSection || !f.studentId) return false
    const matchesClass =
      f.studentId.classId &&
      (f.studentId.classId === selectedGrade._id ||
        f.studentId.classId._id === selectedGrade._id ||
        f.studentId.classId?.name === selectedGrade.name)
    const matchesSection = f.studentId.sectionId === selectedSection
    return matchesClass && matchesSection
  })

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

  const searchColumns = [
    {
      header: 'Student & Roll ID',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {row.studentId ? row.studentId.fullName : 'N/A'}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-medium">
            {row.studentId ? row.studentId.studentId : 'N/A'}
          </div>
          {row.studentId?.guardian?.name && (
            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
              G: {row.studentId.guardian.name}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Grade & Section',
      cell: (row) => {
        const clsName = row.studentId?.classId?.name || 'Class'
        const secId = row.studentId?.sectionId || 'A'
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {clsName} · Sec {secId}
          </span>
        )
      },
    },
    {
      header: 'Challan Voucher #',
      cell: (row) => {
        const activeDue = row.effectiveDueDate || row.dueDate || row.createdAt
        const challanYear = activeDue ? new Date(activeDue).getFullYear() : new Date().getFullYear()
        const suffix = row._id ? row._id.slice(-6).toUpperCase() : '------'
        const challanCode = `CHL-${challanYear}-${suffix}`
        return (
          <div>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {challanCode}
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
              {row.feeStructureId?.title || 'Tuition Fee'}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Base Fee',
      cell: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {formatPKR(row.amountDue)}
        </span>
      ),
    },
    {
      header: 'Concession',
      cell: (row) => {
        if (row.discount > 0) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Tag className="w-3 h-3" /> -{formatPKR(row.discount)}
              </span>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                {row.concessionType !== 'None' ? row.concessionType : 'Institutional'}
              </div>
            </div>
          )
        }
        return <span className="text-xs text-slate-500">None</span>
      },
    },
    {
      header: 'Net Payable',
      cell: (row) => (
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
          {formatPKR(row.netAmount)}
        </span>
      ),
    },
    {
      header: 'Paid',
      cell: (row) => (
        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
          {formatPKR(row.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      cell: (row) => (
        <span className="font-bold text-rose-700 dark:text-rose-400 text-xs">
          {formatPKR(row.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (row) => {
        const isDownloaded = Boolean(row.challanDownloadedAt)
        const activeDue = row.effectiveDueDate || row.dueDate
        const due = activeDue ? new Date(activeDue).toLocaleDateString('en-GB') : 'N/A'
        return (
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {due}
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {isDownloaded ? '10d post-download' : '10d on download'}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          variant={
            row.status === 'Paid'
              ? 'success'
              : row.status === 'Partial'
              ? 'warning'
              : 'danger'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleDownloadChallan(row)}
            disabled={downloadingChallanId === row._id}
            title="Download Bank Fee Challan Voucher (Printable PDF)"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            {downloadingChallanId === row._id ? 'Generating...' : 'Challan'}
          </button>

          <button
            onClick={() => handleOpenConcessionModal(row)}
            title="Apply scholarship or discount concession"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Percent className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            Concession
          </button>

          {row.outstandingAmount > 0 && (
            <button
              onClick={() => handleOpenPayment(row)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Record Payment
            </button>
          )}

          <button
            onClick={() => handleJumpToLedger(row)}
            title="Open section fee ledger"
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Ledger <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ),
    },
  ]

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
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-red-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Overdue Fee Notice: {overdueStats.count} Student{overdueStats.count > 1 ? 's' : ''} have unpaid fees past deadline
              </p>
              <p className="text-xs text-red-700">
                Total outstanding overdue amount across all classes: <span className="font-bold">{formatPKR(overdueStats.total)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOverdueBanner(false)}
            className="text-gray-500 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
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

