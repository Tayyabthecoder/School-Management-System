import React, { useEffect, useState, useMemo } from 'react'
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
import { useToastStore } from '../../store/toastStore'
import {
  RecordPaymentModal,
  ApplyConcessionModal,
  GenerateMonthlyChallansModal,
} from './components/FinanceModals'


export default function FinancePage() {
  const toast = useToastStore()
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
        api.get('/classes'),
        api.get('/students', { params: { limit: 1000 } }),
        api.get('/finance/student-fees', { params: { limit: 1000 } }),
        api.get('/reports/dashboard-stats').catch(() => ({ data: { data: {} } })),
        api.get('/finance/monthly-challans/status').catch(() => ({ data: { data: null } })),
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

  const handleSelectSection = (sec) => {
    setSelectedSection(sec)
    setNavLevel('fees')
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
      console.error('Bulk challan error', err)
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

  const columns = [
    {
      header: 'Student Name & ID',
      cell: (row) => (
        <div>
          <div className="font-semibold text-gray-900">
            {row.studentId ? row.studentId.fullName : 'N/A'}
          </div>
          <div className="text-xs text-indigo-600 font-mono">
            {row.studentId ? row.studentId.studentId : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      header: 'Fee Title',
      cell: (row) => (
        <span className="text-xs font-medium text-gray-700">
          {row.feeStructureId ? row.feeStructureId.title : 'Tuition Fee'}
        </span>
      ),
    },
    {
      header: 'Base Fee',
      cell: (row) => (
        <span className="text-xs text-gray-600 font-medium">
          {formatPKR(row.amountDue)}
        </span>
      ),
    },
    {
      header: 'Concession / Discount',
      cell: (row) => {
        if (row.discount > 0) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Tag className="w-3 h-3" /> -{formatPKR(row.discount)}
              </span>
              <div className="text-[10px] text-gray-500 italic">
                {row.concessionType !== 'None' ? row.concessionType : 'Institutional'}
              </div>
            </div>
          )
        }
        return <span className="text-xs text-gray-400">None</span>
      },
    },
    {
      header: 'Net Payable',
      cell: (row) => (
        <span className="font-bold text-gray-900 text-xs">
          {formatPKR(row.netAmount)}
        </span>
      ),
    },
    {
      header: 'Paid',
      cell: (row) => (
        <span className="text-xs text-emerald-700 font-semibold">
          {formatPKR(row.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      cell: (row) => (
        <span className="font-bold text-rose-700 text-xs">
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
            <span className="text-xs font-bold text-gray-800">
              {due}
            </span>
            <div className="text-[10px] text-gray-500 font-medium">
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
        <div className="flex items-center gap-1.5">
          {/* Download Challan Button */}
          <button
            onClick={() => handleDownloadChallan(row)}
            disabled={downloadingChallanId === row._id}
            title="Download Bank Fee Challan Voucher (Printable PDF)"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3 text-amber-700" />
            {downloadingChallanId === row._id ? 'Generating...' : 'Challan'}
          </button>

          {/* Apply Concession Button */}
          <button
            onClick={() => handleOpenConcessionModal(row)}
            title="Apply scholarship or discount concession"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Percent className="w-3 h-3 text-emerald-700" />
            Concession
          </button>

          {/* Record Payment Button */}
          {row.outstandingAmount > 0 && (
            <button
              onClick={() => handleOpenPayment(row)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Record Payment
            </button>
          )}
        </div>
      ),
    },
  ]

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
            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
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
        return <span className="text-xs text-slate-400">None</span>
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
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-400 shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  Automated Recurring Fee Challan System
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Cron Active
                </span>
                <span className="text-xs text-indigo-200/80 hidden sm:inline">
                  • 1st of every month @ 00:00 (Midnight PKT)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Generates monthly tuition fee challans for all enrolled students across all 13 grades (Play Junior to Grade 12) with due date falling 10 days after challan download, preserving scholarships and sibling discounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-white/10 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">Current Cycle Status:</div>
              <div className="text-xs font-bold text-indigo-200">
                {cronStatus?.currentMonth || 'Current Month'}: {cronStatus?.currentMonthChallansCount || 0} / {cronStatus?.totalActiveStudents || students.length} Students
              </div>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Generate Monthly Challans
            </button>
          </div>
        </div>
      </div>

      {showOverdueBanner && overdueStats.count > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-red-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
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
            className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Global Student & Challan Search Bar */}
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any student by name, student ID (e.g. STU-0012), or challan # (e.g. CHL-2026-ABCDEF)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 overflow-x-auto">
            {['All', 'Pending', 'Partial', 'Overdue', 'Paid'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Active Indicator / Summary */}
        {searchQuery.trim() && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Found <strong className="text-indigo-600 dark:text-indigo-400">{searchedFees.length}</strong> record{searchedFees.length === 1 ? '' : 's'} matching &ldquo;<span className="text-slate-800 dark:text-slate-200 font-semibold">{searchQuery}</span>&rdquo;
              {statusFilter !== 'All' && <span> with status <strong>{statusFilter}</strong></span>}
            </span>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('All')
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Search Results OR Navigation Views */}
      {searchQuery.trim().length > 0 ? (
        <div className="space-y-4">
          <div className="card-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Search Results
                </h3>
                <Badge variant="indigo">{searchedFees.length} Found</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fee accounts & challan vouchers matching &ldquo;{searchQuery}&rdquo; across all academic grades
              </p>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Grade View
            </button>
          </div>

          <DataTable
            columns={searchColumns}
            data={searchedFees}
            loading={loading}
            emptyMessage={`No student fee records or challans found matching "${searchQuery}".`}
          />
        </div>
      ) : (
        <>
          {navLevel === 'grades' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Select Academic Grade (1–12)
              </h2>
              <p className="text-xs text-gray-500">
                Pick a grade level to review fee ledgers, manage concessions, and print 3-part bank fee challans.
              </p>
            </div>
            <Badge variant="indigo">{displayClasses.length} Grades Configured</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayClasses.map((cls, index) => {
              const theme = GRADE_THEMES[index % GRADE_THEMES.length]
              const gradeStudents = students.filter(
                (s) =>
                  s.classId &&
                  (s.classId._id === cls._id ||
                    s.classId === cls._id ||
                    s.classId?.name === cls.name)
              ).length
              const classSections = getSectionsForGrade(cls)
              const classFee = studentFees.find(
                (f) =>
                  f.studentId?.classId &&
                  (f.studentId.classId === cls._id ||
                    f.studentId.classId._id === cls._id ||
                    f.studentId.classId?.name === cls.name)
              )
              const monthlyAmount = classFee?.amountDue || (8000 + (cls.level || 0) * 500)

              return (
                <div
                  key={cls._id || cls.name}
                  onClick={() => handleSelectGrade(cls)}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-lg ${theme.shadow} hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase">
                      Level {cls.level}
                    </span>
                    <CircleDollarSign className="w-6 h-6 text-white/90" />
                  </div>

                  <h3 className="text-2xl font-extrabold mb-1">{cls.name}</h3>
                  <p className="text-xs text-white/80 font-medium mb-4">
                    Sections: {classSections.join(', ')} • {formatPKR(monthlyAmount)}/mo
                  </p>

                  <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {gradeStudents} Students
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Fee Ledger <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {navLevel === 'sections' && selectedGrade && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setNavLevel('grades')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Grades
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  GRADE LEVEL {selectedGrade.level}
                </span>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {selectedGrade.name} - Select Section
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Select a section to inspect student accounts, concessions, and download 3-part bank deposit vouchers.
                </p>
              </div>
              <Badge variant="indigo">{sectionsToDisplay.length} Sections</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sectionsToDisplay.map((sec) => {
                const secStudentsCount = students.filter(
                  (s) =>
                    s.classId &&
                    (s.classId._id === selectedGrade._id ||
                      s.classId === selectedGrade._id ||
                      s.classId?.name === selectedGrade.name) &&
                    s.sectionId === sec
                ).length

                return (
                  <div
                    key={sec}
                    onClick={() => handleSelectSection(sec)}
                    className="bg-gray-50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                        {sec}
                      </div>
                      <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-full border text-gray-600">
                        Section {sec}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {selectedGrade.name} - Section {sec}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" /> {secStudentsCount} Enrolled Students
                    </p>

                    <div className="w-full py-2 bg-white group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
                      Open Fee Ledger <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {navLevel === 'fees' && selectedGrade && selectedSection && (
        <div>
          <GradeSectionNavigator
            grades={displayClasses}
            selectedGrade={selectedGrade}
            selectedSection={selectedSection}
            onSelectGrade={(g) => {
              setSelectedGrade(g)
              const secs = getSectionsForGrade(g)
              setSelectedSection(secs.includes(selectedSection) ? selectedSection : (secs[0] || 'A'))
            }}
            onSelectSection={(sec) => setSelectedSection(sec)}
            students={students}
            rightSlot={
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Printer}
                  loading={bulkPrinting}
                  onClick={handleBulkPrintChallans}
                >
                  {bulkPrinting ? (bulkProgress || 'Generating...') : 'Bulk Print Section Challans'}
                </Button>
                <button
                  onClick={() => setNavLevel('grades')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> All Grades
                </button>
              </div>
            }
          />

          <div className="card-surface p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {selectedGrade.name} · SECTION {selectedSection}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Fee Balance & Concession Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official printable Bank Fee Challan vouchers (configurable 2-part or 3-part in Settings)
              </p>
            </div>
            <Badge variant="indigo">{activeFeeLedger.length} Accounts Active</Badge>
          </div>

          <DataTable
            columns={columns}
            data={activeFeeLedger}
            loading={loading}
            emptyMessage={`No student fee records found for ${selectedGrade.name} - Section ${selectedSection}.`}
          />
        </div>
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

