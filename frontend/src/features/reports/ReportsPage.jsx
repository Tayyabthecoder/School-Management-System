import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Users,
  UserCheck,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  Download,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  Filter,
  Eye,
  CheckSquare,
  Square,
  Check,
  FileCheck,
  GraduationCap,
  Award,
  BookOpen,
  Wallet,
  CreditCard,
  Percent,
  ArrowUpRight,
  CheckCircle2,
  X,
  PhoneCall,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useToastStore } from '../../store/toastStore'
import { formatPKR } from '../../lib/formatters'
import api from '../../lib/axios'
import { SkeletonCard } from '../../components/ui/Skeleton'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Available entities and selectable fields for Dynamic Custom Report Builder (FR-RP-03)
const REPORT_ENTITIES = [
  {
    id: 'students',
    label: 'Students Directory',
    description: 'Demographics, admission details, classes, and guardian records',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Full Name' },
      { id: 'gender', label: 'Gender' },
      { id: 'className', label: 'Class / Grade' },
      { id: 'sectionId', label: 'Section' },
      { id: 'guardianName', label: 'Guardian Name' },
      { id: 'guardianPhone', label: 'Guardian Phone' },
      { id: 'cnic', label: 'B-Form / CNIC' },
      { id: 'bloodGroup', label: 'Blood Group' },
      { id: 'joiningDate', label: 'Admission Date' },
      { id: 'status', label: 'Enrollment Status' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff & Faculty Directory',
    description: 'Employment details, designations, departments, and payroll base',
    fields: [
      { id: 'staffId', label: 'Staff ID' },
      { id: 'fullName', label: 'Full Name' },
      { id: 'designation', label: 'Designation' },
      { id: 'department', label: 'Department' },
      { id: 'phone', label: 'Phone Number' },
      { id: 'email', label: 'Email' },
      { id: 'cnic', label: 'CNIC' },
      { id: 'joiningDate', label: 'Joining Date' },
      { id: 'salary', label: 'Base Salary (PKR)' },
      { id: 'status', label: 'Active Status' },
    ],
  },
  {
    id: 'fees',
    label: 'Fee Ledger & Balances',
    description: 'Student fee charges, payments, outstanding dues, and deadlines',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'className', label: 'Class' },
      { id: 'sectionId', label: 'Section' },
      { id: 'amountDue', label: 'Amount Due' },
      { id: 'amountPaid', label: 'Amount Paid' },
      { id: 'outstandingAmount', label: 'Outstanding Balance' },
      { id: 'status', label: 'Fee Status' },
      { id: 'dueDate', label: 'Due Date' },
    ],
  },
  {
    id: 'attendance',
    label: 'Student Daily Attendance',
    description: 'Daily attendance roster records with present/absent/late status',
    fields: [
      { id: 'date', label: 'Date' },
      { id: 'className', label: 'Class' },
      { id: 'sectionId', label: 'Section' },
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'status', label: 'Attendance Status' },
    ],
  },
  {
    id: 'grades',
    label: 'Academic Grades & Examination',
    description: 'Exam marks, subjects, percentages, and letter grades',
    fields: [
      { id: 'studentId', label: 'Student ID' },
      { id: 'fullName', label: 'Student Name' },
      { id: 'className', label: 'Class' },
      { id: 'termName', label: 'Academic Term' },
      { id: 'subjectName', label: 'Subject' },
      { id: 'maxMarks', label: 'Max Marks' },
      { id: 'marksObtained', label: 'Marks Obtained' },
      { id: 'percentage', label: 'Percentage' },
      { id: 'gradeLetter', label: 'Letter Grade' },
    ],
  },
]

// --- Report Card Component ----------------------------------------------------
function ReportCard({ icon: Icon, color, title, description, actions }) {
  const COLOR_MAP = {
    emerald: {
      icon: 'bg-emerald-100 text-emerald-700',
      badge: 'bg-emerald-50 border-emerald-200',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
    },
    indigo: {
      icon: 'bg-indigo-100 text-indigo-700',
      badge: 'bg-indigo-50 border-indigo-200',
      btn: 'bg-indigo-600 hover:bg-indigo-700',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-700',
      badge: 'bg-amber-50 border-amber-200',
      btn: 'bg-amber-600 hover:bg-amber-700',
    },
    rose: {
      icon: 'bg-rose-100 text-rose-700',
      badge: 'bg-rose-50 border-rose-200',
      btn: 'bg-rose-600 hover:bg-rose-700',
    },
    teal: {
      icon: 'bg-teal-100 text-teal-700',
      badge: 'bg-teal-50 border-teal-200',
      btn: 'bg-teal-600 hover:bg-teal-700',
    },
    violet: {
      icon: 'bg-violet-100 text-violet-700',
      badge: 'bg-violet-50 border-violet-200',
      btn: 'bg-violet-600 hover:bg-violet-700',
    },
    cyan: {
      icon: 'bg-cyan-100 text-cyan-700',
      badge: 'bg-cyan-50 border-cyan-200',
      btn: 'bg-cyan-600 hover:bg-cyan-700',
    },
  }
  const c = COLOR_MAP[color] || COLOR_MAP.indigo

  return (
    <div className={`bg-white border-2 ${c.badge} rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between`}>
      <div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{description}</p>
      </div>
      <div className={`pt-2 border-t border-gray-100 ${actions.length === 1 ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'}`}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            disabled={action.loading}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-[11px] font-bold rounded-lg shadow-2xs disabled:opacity-60 transition-colors ${
              action.variant === 'secondary'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                : `${c.btn} text-white`
            }`}
          >
            <Download className="w-3 h-3 shrink-0" />
            <span className="truncate">{action.loading ? '...' : action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Date Range Picker --------------------------------------------------------
function DateRange({ label, fromVal, toVal, onFrom, onTo }) {
  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">{label} — From</label>
        <input
          type="date"
          value={fromVal}
          onChange={(e) => onFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
        <input
          type="date"
          value={toVal}
          onChange={(e) => onTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  )
}

// --- Main Page ----------------------------------------------------------------
export default function ReportsPage() {
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState('export') // 'export' | 'custom' | 'analytics'

  // Fee date range
  const [feeFrom, setFeeFrom] = useState('')
  const [feeTo, setFeeTo] = useState('')

  // Attendance date range
  const [attFrom, setAttFrom] = useState('')
  const [attTo, setAttTo] = useState('')

  // Payroll / Staff Attendance month/year
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1)
  const [payYear, setPayYear] = useState(new Date().getFullYear())

  const [loadingMap, setLoadingMap] = useState({})

  // Analytics Data
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [feeTrend, setFeeTrend] = useState([])
  const [classCollection, setClassCollection] = useState([])
  const [defaulterAging, setDefaulterAging] = useState(null)
  const [academicAnalytics, setAcademicAnalytics] = useState(null)
  const [demographics, setDemographics] = useState(null)
  const [teacherAnalytics, setTeacherAnalytics] = useState(null)
  const [cashflowForecast, setCashflowForecast] = useState(null)
  const [concessionAnalytics, setConcessionAnalytics] = useState(null)
  const [paymentVelocity, setPaymentVelocity] = useState(null)
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false)

  // Dynamic Custom Report Builder State (FR-RP-03)
  const [customEntity, setCustomEntity] = useState('students')
  const [selectedFields, setSelectedFields] = useState(REPORT_ENTITIES[0].fields.map(f => f.id))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [customClassId, setCustomClassId] = useState('ALL')
  const [customSectionId, setCustomSectionId] = useState('ALL')
  const [customSortBy, setCustomSortBy] = useState('default')
  const [customSortOrder, setCustomSortOrder] = useState(1)
  const [customStatus, setCustomStatus] = useState('ALL')
  const [classesList, setClassesList] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [customExportLoading, setCustomExportLoading] = useState(null) // 'excel' | 'pdf' | null

  const setLoading = (key, val) => setLoadingMap((prev) => ({ ...prev, [key]: val }))

  // Load classes list for dropdown filter
  useEffect(() => {
    api.get('/classes')
      .then(res => {
        if (res.data?.success) setClassesList(res.data.data || [])
      })
      .catch(() => {})
  }, [])

  // When customEntity changes, default selected fields to all fields of that entity
  const handleEntityChange = (newEntityId) => {
    setCustomEntity(newEntityId)
    const entityCfg = REPORT_ENTITIES.find(e => e.id === newEntityId)
    if (entityCfg) {
      setSelectedFields(entityCfg.fields.map(f => f.id))
    }
    setPreviewData(null)
  }

  // Toggle field selection
  const toggleField = (fieldId) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    )
  }

  const selectAllFields = () => {
    const entityCfg = REPORT_ENTITIES.find(e => e.id === customEntity)
    if (entityCfg) {
      setSelectedFields(entityCfg.fields.map(f => f.id))
    }
  }

  const clearAllFields = () => {
    setSelectedFields([])
  }

  // Robust Blob Download helper with JSON error parsing
  const downloadBlobResponse = async (response, fallbackName) => {
    const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition']
    let filename = fallbackName
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) {
        filename = match[1]
      }
    }

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }

  const handleExport = async (key, url) => {
    setLoading(key, true)
    try {
      const endpoint = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url
      const response = await api.get(endpoint, { responseType: 'blob' })
      const ext = url.includes('format=pdf') ? 'pdf' : 'xlsx'
      await downloadBlobResponse(response, `${key}-report.${ext}`)
      toast.success('Report downloaded successfully!')
    } catch (err) {
      console.error('Export error:', err)
      let msg = 'Failed to generate report export'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          if (parsed?.error?.message) msg = parsed.error.message
          else if (parsed?.message) msg = parsed.message
        } catch (_) {}
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message
      }
      toast.error(msg)
    } finally {
      setLoading(key, false)
    }
  }

  // Handle Custom Report Preview
  const handlePreviewCustomReport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to include in the report')
      return
    }

    setPreviewLoading(true)
    try {
      const payload = {
        entity: customEntity,
        fields: selectedFields,
        filters: {
          classId: customClassId,
          sectionId: customSectionId,
          status: customStatus,
          from: customFrom || undefined,
          to: customTo || undefined,
        },
        sortBy: customSortBy === 'default' ? undefined : customSortBy,
        sortOrder: customSortOrder,
      }
      const res = await api.post('/reports/custom/preview', payload)
      if (res.data?.success) {
        setPreviewData(res.data.data)
        toast.success(`Found ${res.data.data.count} records`)
      }
    } catch (err) {
      toast.error('Failed to preview custom report')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle Custom Report Export (Excel or PDF)
  const handleExportCustomReport = async (format) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export')
      return
    }

    setCustomExportLoading(format)
    try {
      const payload = {
        entity: customEntity,
        fields: selectedFields,
        filters: {
          classId: customClassId,
          sectionId: customSectionId,
          status: customStatus,
          from: customFrom || undefined,
          to: customTo || undefined,
        },
        sortBy: customSortBy === 'default' ? undefined : customSortBy,
        sortOrder: customSortOrder,
        format,
        title: `${customEntity.toUpperCase()} Custom Report`,
      }

      const response = await api.post('/reports/custom/export', payload, { responseType: 'blob' })
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      await downloadBlobResponse(response, `${customEntity}_custom_report.${ext}`)
      toast.success(`${format.toUpperCase()} report generated successfully!`)
    } catch (err) {
      let msg = `Failed to generate ${format.toUpperCase()} export`
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          if (parsed?.error?.message) msg = parsed.error.message
        } catch (_) {}
      }
      toast.error(msg)
    } finally {
      setCustomExportLoading(null)
    }
  }

  const buildFeeUrl = (format = 'excel') => {
    let url = `/api/v1/reports/export?entity=fees&format=${format}`
    if (feeFrom) url += `&from=${feeFrom}`
    if (feeTo) url += `&to=${feeTo}`
    return url
  }

  const buildAttUrl = (format = 'excel') => {
    let url = `/api/v1/reports/export?entity=attendance&format=${format}`
    if (attFrom) url += `&from=${attFrom}`
    if (attTo) url += `&to=${attTo}`
    return url
  }

  // Fetch analytics data when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      const fetchAnalytics = async () => {
        setAnalyticsLoading(true)
        try {
          const [
            trendRes,
            classRes,
            agingRes,
            acadRes,
            demoRes,
            teacherRes,
            cashflowRes,
            concessionRes,
            velocityRes,
          ] = await Promise.allSettled([
            api.get('/reports/fee-trend?months=6'),
            api.get('/reports/fee-collection-by-class'),
            api.get('/reports/defaulter-aging'),
            api.get('/reports/academic-performance'),
            api.get('/reports/demographics'),
            api.get('/reports/teacher-performance'),
            api.get('/reports/financial-intelligence/cashflow-forecast'),
            api.get('/reports/financial-intelligence/concession-roi'),
            api.get('/reports/financial-intelligence/payment-velocity'),
          ])

          if (trendRes.status === 'fulfilled' && trendRes.value.data?.success) {
            setFeeTrend(trendRes.value.data.data)
          }
          if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
            setClassCollection(classRes.value.data.data)
          }
          if (agingRes.status === 'fulfilled' && agingRes.value.data?.success) {
            setDefaulterAging(agingRes.value.data.data)
          }
          if (acadRes.status === 'fulfilled' && acadRes.value.data?.success) {
            setAcademicAnalytics(acadRes.value.data.data)
          }
          if (demoRes.status === 'fulfilled' && demoRes.value.data?.success) {
            setDemographics(demoRes.value.data.data)
          }
          if (teacherRes.status === 'fulfilled' && teacherRes.value.data?.success) {
            setTeacherAnalytics(teacherRes.value.data.data)
          }
          if (cashflowRes.status === 'fulfilled' && cashflowRes.value.data?.success) {
            setCashflowForecast(cashflowRes.value.data.data)
          }
          if (concessionRes.status === 'fulfilled' && concessionRes.value.data?.success) {
            setConcessionAnalytics(concessionRes.value.data.data)
          }
          if (velocityRes.status === 'fulfilled' && velocityRes.value.data?.success) {
            setPaymentVelocity(velocityRes.value.data.data)
          }
        } catch (err) {
          console.error('Failed to load analytics', err)
        } finally {
          setAnalyticsLoading(false)
        }
      }
      fetchAnalytics()
    }
  }, [activeTab])

  const activeEntityConfig = REPORT_ENTITIES.find(e => e.id === customEntity) || REPORT_ENTITIES[0]

  return (
    <div>
      <Breadcrumb
        title="Reports & Analytics Center"
        subtitle="Export institutional ledgers, design dynamic custom reports, and explore revenue analytics."
      />

      {/* -- Tabs Header ----------------------------------------------- */}
      <div className="flex border-b border-gray-200 space-x-3 mb-6">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Data Reports (.xlsx)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Dynamic Custom Report Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial & Institutional Analytics</span>
        </button>
      </div>

      {/* -- TAB 1: PRE-CONFIGURED EXPORT REPORTS ----------------------- */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Date Range Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-500" />
              Report Customization Filters
            </h2>
            <div className="flex flex-wrap gap-6">
              <DateRange
                label="Fee Reports"
                fromVal={feeFrom}
                toVal={feeTo}
                onFrom={setFeeFrom}
                onTo={setFeeTo}
              />
              <DateRange
                label="Student Attendance"
                fromVal={attFrom}
                toVal={attTo}
                onFrom={setAttFrom}
                onTo={setAttTo}
              />
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Payroll & Staff Attendance Month
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={payYear}
                    onChange={(e) => setPayYear(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Standard Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard
              icon={Users}
              color="indigo"
              title="Student Master Directory"
              description="Complete active student records including class, section, guardian information, and status."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['students-xlsx'],
                  onClick: () => handleExport('students-xlsx', '/api/v1/reports/export?entity=students&format=excel'),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['students-pdf'],
                  onClick: () => handleExport('students-pdf', '/api/v1/reports/export?entity=students&format=pdf'),
                },
              ]}
            />

            <ReportCard
              icon={UserCheck}
              color="emerald"
              title="Staff & Faculty Directory"
              description="Employee register with designation, department, CNIC, joining date, and salary breakdown."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['staff-xlsx'],
                  onClick: () => handleExport('staff-xlsx', '/api/v1/reports/export?entity=staff&format=excel'),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['staff-pdf'],
                  onClick: () => handleExport('staff-pdf', '/api/v1/reports/export?entity=staff&format=pdf'),
                },
              ]}
            />

            <ReportCard
              icon={DollarSign}
              color="amber"
              title="Fee Collection & Ledger"
              description="Student fee ledger with collected amounts, outstanding balances, and payment status breakdown."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['fees-xlsx'],
                  onClick: () => handleExport('fees-xlsx', buildFeeUrl('excel')),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['fees-pdf'],
                  onClick: () => handleExport('fees-pdf', buildFeeUrl('pdf')),
                },
              ]}
            />

            <ReportCard
              icon={AlertTriangle}
              color="rose"
              title="Fee Defaulters List"
              description="Students with outstanding fees beyond deadline — sorted for accounts follow-up."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['defaulters-xlsx'],
                  onClick: () => handleExport('defaulters-xlsx', '/api/v1/reports/export?entity=defaulters&format=excel'),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['defaulters-pdf'],
                  onClick: () => handleExport('defaulters-pdf', '/api/v1/reports/export?entity=defaulters&format=pdf'),
                },
              ]}
            />

            <ReportCard
              icon={CalendarCheck}
              color="teal"
              title="Student Attendance Summary"
              description="Grade-wise and section-wise daily attendance summary with present, absent, late counts."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['attendance-xlsx'],
                  onClick: () => handleExport('attendance-xlsx', buildAttUrl('excel')),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['attendance-pdf'],
                  onClick: () => handleExport('attendance-pdf', buildAttUrl('pdf')),
                },
              ]}
            />

            <ReportCard
              icon={Clock}
              color="cyan"
              title="Staff Monthly Attendance Ledger"
              description="Staff member attendance records with total working days, present days, absent days, and rates."
              actions={[
                {
                  label: `Excel (${payMonth}/${payYear})`,
                  loading: loadingMap['staff-att-xlsx'],
                  onClick: () => handleExport('staff-att-xlsx', `/api/v1/reports/export?entity=staff-attendance&month=${payMonth}&year=${payYear}&format=excel`),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['staff-att-pdf'],
                  onClick: () => handleExport('staff-att-pdf', `/api/v1/reports/export?entity=staff-attendance&month=${payMonth}&year=${payYear}&format=pdf`),
                },
              ]}
            />

            <ReportCard
              icon={FileText}
              color="violet"
              title="Payroll Summary Report"
              description="Monthly payroll summary showing basic pay, allowances, deductions, and net pay per staff member."
              actions={[
                {
                  label: `Excel (${payMonth}/${payYear})`,
                  loading: loadingMap['payroll-xlsx'],
                  onClick: () => handleExport('payroll-xlsx', `/api/v1/reports/export?entity=payroll&month=${payMonth}&year=${payYear}&format=excel`),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['payroll-pdf'],
                  onClick: () => handleExport('payroll-pdf', `/api/v1/reports/export?entity=payroll&month=${payMonth}&year=${payYear}&format=pdf`),
                },
              ]}
            />

            <ReportCard
              icon={GraduationCap}
              color="indigo"
              title="Academic Performance Summary"
              description="Term examination results, grading distributions, subject score averages, and class passing rates."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['academic-xlsx'],
                  onClick: () => handleExport('academic-xlsx', '/api/v1/reports/export?entity=academic-performance&format=excel'),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['academic-pdf'],
                  onClick: () => handleExport('academic-pdf', '/api/v1/reports/export?entity=academic-performance&format=pdf'),
                },
              ]}
            />

            <ReportCard
              icon={Award}
              color="teal"
              title="Teacher Performance Ledger"
              description="Faculty workload metrics including assigned classes, subject allocations, and attendance rates."
              actions={[
                {
                  label: 'Excel (.xlsx)',
                  loading: loadingMap['teacher-xlsx'],
                  onClick: () => handleExport('teacher-xlsx', '/api/v1/reports/export?entity=teacher-performance&format=excel'),
                },
                {
                  label: 'PDF Report',
                  variant: 'secondary',
                  loading: loadingMap['teacher-pdf'],
                  onClick: () => handleExport('teacher-pdf', '/api/v1/reports/export?entity=teacher-performance&format=pdf'),
                },
              ]}
            />
          </div>
        </div>
      )}

      {/* -- TAB 2: DYNAMIC CUSTOM REPORT BUILDER (FR-RP-03) ------------ */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Dynamic Custom Report Builder (SRS FR-RP-03)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a primary data entity, pick your required fields, apply filters, and export customized Excel or PDF reports.
                </p>
              </div>
            </div>

            {/* Step 1: Entity Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Select Primary Data Entity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {REPORT_ENTITIES.map((ent) => {
                  const isSelected = customEntity === ent.id
                  return (
                    <button
                      key={ent.id}
                      onClick={() => handleEntityChange(ent.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {ent.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ent.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Field Selection Checkboxes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  2. Choose Columns to Include ({selectedFields.length} of {activeEntityConfig.fields.length} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFields}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={clearAllFields}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 p-4 bg-gray-50/60 rounded-xl border border-gray-200">
                {activeEntityConfig.fields.map((f) => {
                  const isChecked = selectedFields.includes(f.id)
                  return (
                    <label
                      key={f.id}
                      onClick={() => toggleField(f.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-white border-indigo-400 text-indigo-900 shadow-sm'
                          : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{f.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Filter Controls */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                3. Apply Filter Criteria (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 p-4 bg-gray-50/60 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Grade / Class</label>
                  <select
                    value={customClassId}
                    onChange={(e) => {
                      setCustomClassId(e.target.value)
                      setCustomSectionId('ALL')
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Classes</option>
                    {classesList.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Section</label>
                  <select
                    value={customSectionId}
                    onChange={(e) => setCustomSectionId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Sections</option>
                    {(() => {
                      const selClass = classesList.find(c => c._id === customClassId)
                      return (selClass?.sections || []).map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status Filter</label>
                  <select
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sort By</label>
                  <select
                    value={customSortBy}
                    onChange={(e) => setCustomSortBy(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="default">Default Order</option>
                    {activeEntityConfig.fields.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Sort Direction</label>
                  <select
                    value={customSortOrder}
                    onChange={(e) => setCustomSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>Ascending (A–Z / 0–9)</option>
                    <option value={-1}>Descending (Z–A / 9–0)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date Range: From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Date Range: To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handlePreviewCustomReport}
                disabled={previewLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-60"
              >
                <Eye className="w-4 h-4" />
                {previewLoading ? 'Loading Preview...' : 'Preview Report (First 50)'}
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleExportCustomReport('excel')}
                  disabled={customExportLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {customExportLoading === 'excel' ? 'Exporting...' : 'Export Excel (.xlsx)'}
                </button>

                <button
                  onClick={() => handleExportCustomReport('pdf')}
                  disabled={customExportLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-60"
                >
                  <FileText className="w-4 h-4" />
                  {customExportLoading === 'pdf' ? 'Exporting...' : 'Export PDF Report (.pdf)'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Preview Panel */}
          {previewData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Interactive Preview</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                    {previewData.count} Total Records Matched
                  </span>
                </div>
                <span className="text-xs text-gray-400">Showing first {previewData.rows.length} rows</span>
              </div>

              {previewData.rows.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No records match your selected criteria.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        {previewData.columns.map((col) => (
                          <th key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          {previewData.columns.map((col) => (
                            <td key={col.key} className="px-4 py-2 text-gray-800 whitespace-nowrap">
                              {String(row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -- TAB 3: FINANCIAL ANALYTICS -------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              {/* Top Row: Defaulter Aging Breakdown Cards */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Defaulter Aging Analysis
                  </h3>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    Total Outstanding: {formatPKR(defaulterAging?.totalOutstanding || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">0–30 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['0-30']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-amber-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['0-30']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
                    <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">31–60 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['31-60']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-orange-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['31-60']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">61–90 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['61-90']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-rose-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['61-90']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-red-100/70 border border-red-300 rounded-xl">
                    <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">90+ Days Critical</p>
                    <p className="text-2xl font-bold text-red-950 mt-1">
                      {defaulterAging?.buckets?.['90+']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-red-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['90+']?.amount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Monthly Fee Collection Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      6-Month Fee Revenue Trend
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={feeTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨ ${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [formatPKR(value), 'Collections']} />
                        <Line
                          type="monotone"
                          dataKey="collected"
                          stroke="#4F46E5"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#4F46E5' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Fee Collection Rate by Class */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Fee Collection Rate (%) by Grade
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classCollection} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="className" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={45} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Collection Rate']} />
                        <Bar dataKey="collectionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2.5: Financial Intelligence & Predictive Cash Flow Suite (Pillar 2) */}
              {cashflowForecast && (
                <div className="space-y-6">
                  {/* 1. Predictive Cash Flow & 90-Day Liquidity Forecast */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-emerald-600" />
                          Predictive Cash Flow & 90-Day Liquidity Forecast (Pillar 2)
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Empirical tuition inflow projections modeled against fixed monthly staff payroll obligations
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                          Monthly Payroll Obligation: {formatPKR(cashflowForecast.monthlyPayrollObligation || 0)}
                        </span>
                      </div>
                    </div>

                    {/* 3-Month Forecast Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {(cashflowForecast.forecast || []).map((m, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-linear-to-b from-gray-50/70 to-white flex flex-col justify-between shadow-2xs">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{m.month}</span>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                {m.confidenceScore}% Confidence
                              </span>
                            </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Gross Scheduled:</span>
                                <span className="font-medium text-gray-800">{formatPKR(m.grossBillable)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Concessions / Aid:</span>
                                <span className="font-medium text-rose-600">-{formatPKR(m.concessions)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Projected Inflow:</span>
                                <span className="font-bold text-emerald-700">{formatPKR(m.projectedInflow)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Payroll Liability:</span>
                                <span className="font-medium text-gray-700">-{formatPKR(m.payrollLiability)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-600">Net Operating Margin:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              m.netOperatingMargin >= 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {m.netOperatingMargin >= 0 ? '+' : ''}{formatPKR(m.netOperatingMargin)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart: Projected Inflow vs Payroll Liability */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                      <div className="lg:col-span-2 h-64">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Projected Cash Inflow vs Mandatory Payroll Obligations
                        </p>
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={cashflowForecast.forecast || []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨ ${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => [formatPKR(value)]} />
                            <Legend verticalAlign="top" height={36} />
                            <Area
                              type="monotone"
                              dataKey="projectedInflow"
                              name="Projected Tuition Inflow"
                              stroke="#10B981"
                              fill="#D1FAE5"
                              strokeWidth={2}
                            />
                            <Area
                              type="monotone"
                              dataKey="payrollLiability"
                              name="Fixed Payroll Liability"
                              stroke="#F59E0B"
                              fill="#FEF3C7"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Historical Collection Velocity Curve */}
                      <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            Empirical Collection Velocity Curve
                          </p>
                          <p className="text-[11px] text-gray-500 mb-3">
                            Historical behavioral lag between Challan due dates and guardian bank/cash settlement
                          </p>

                          <div className="space-y-2.5">
                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-emerald-800">Early Settlers (Prior to Due Date)</span>
                                <span className="font-bold text-emerald-700">{cashflowForecast.historicalVelocity?.earlyPercentage || 18}%</span>
                              </div>
                              <div className="w-full bg-emerald-100 rounded-full h-1.5">
                                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.earlyPercentage || 18}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-indigo-800">Due Date Rush (1–10 Days)</span>
                                <span className="font-bold text-indigo-700">{cashflowForecast.historicalVelocity?.onTimePercentage || 64}%</span>
                              </div>
                              <div className="w-full bg-indigo-100 rounded-full h-1.5">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.onTimePercentage || 64}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-amber-800">Grace & Reminder Window (11–30 Days)</span>
                                <span className="font-bold text-amber-700">{cashflowForecast.historicalVelocity?.delayedPercentage || 11}%</span>
                              </div>
                              <div className="w-full bg-amber-100 rounded-full h-1.5">
                                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.delayedPercentage || 11}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-rose-800">Chronic Delinquent Debt (&gt;30 Days)</span>
                                <span className="font-bold text-rose-700">{cashflowForecast.historicalVelocity?.delinquentPercentage || 7}%</span>
                              </div>
                              <div className="w-full bg-rose-100 rounded-full h-1.5">
                                <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.delinquentPercentage || 7}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-200">
                          Data dynamically computed from 180-day empirical payment logs.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Concession & Scholarship Impact Matrix & ROI */}
                  {concessionAnalytics && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <Percent className="w-5 h-5 text-indigo-600" />
                            Institutional Concessions & Scholarship ROI Matrix
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tuition discounts awarded cross-referenced with beneficiary exam performance
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                            Total Concessions: {formatPKR(concessionAnalytics.totalConcessionsAwarded || 0)}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            Beneficiaries: {concessionAnalytics.beneficiaryCount || 0} students
                          </span>
                          {concessionAnalytics.flaggedStudents?.length > 0 && (
                            <button
                              onClick={() => setIsReviewDrawerOpen(true)}
                              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {concessionAnalytics.flaggedStudents.length} Review Required
                            </button>
                          )}
                        </div>
                      </div>

                      {(!concessionAnalytics.categories || concessionAnalytics.categories.length === 0) ? (
                        <p className="py-6 text-center text-xs text-gray-400">No active scholarship or concession records found.</p>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2.5">Concession / Aid Category</th>
                                <th className="px-4 py-2.5 text-center">Student Beneficiaries</th>
                                <th className="px-4 py-2.5 text-right">Total Concession Value</th>
                                <th className="px-4 py-2.5 text-center">Cohort Academic Avg</th>
                                <th className="px-4 py-2.5 text-right">Scholarship Review Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {concessionAnalytics.categories.map((c, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="px-4 py-2.5 font-bold text-gray-900">{c.type}</td>
                                  <td className="px-4 py-2.5 text-center font-medium text-gray-700">{c.headcount}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-indigo-700">{formatPKR(c.totalAmount)}</td>
                                  <td className="px-4 py-2.5 text-center font-bold text-gray-800">
                                    <span className={`inline-block px-2 py-0.5 rounded-md ${
                                      c.averageGradePercentage >= 75
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {c.averageGradePercentage}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {c.reviewRequiredCount > 0 ? (
                                      <button
                                        onClick={() => setIsReviewDrawerOpen(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        {c.reviewRequiredCount} Below Benchmark
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Compliant
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Payment Recovery Channels & Settlement Latency */}
                  {paymentVelocity && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Payment Recovery Channels & Settlement Latency
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tuition settlement velocity and digital payment adoption trends
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                          <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Median Days to Settle</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.medianDaysToSettle} <span className="text-xs font-normal text-gray-500">days after due</span>
                          </p>
                          <p className="text-[11px] text-indigo-600 mt-1">50% of guardians settle within this window</p>
                        </div>

                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">On-Time Settlement Rate</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.onTimeCollectionRate}%
                          </p>
                          <p className="text-[11px] text-emerald-600 mt-1">Paid on or prior to official deadline</p>
                        </div>

                        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl">
                          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">Digital Payment Adoption</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.digitalAdoptionRate}%
                          </p>
                          <p className="text-[11px] text-teal-600 mt-1">Settled via Bank Transfer, Online, JazzCash, or EasyPaisa</p>
                        </div>
                      </div>

                      {/* Payment Channels Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {(paymentVelocity.channelBreakdown || []).map((ch, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <p className="text-xs font-bold text-gray-800">{ch.mode}</p>
                            <p className="text-sm font-extrabold text-indigo-700 mt-1">{formatPKR(ch.totalAmount)}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{ch.transactionCount} transactions ({ch.share}%)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Academic Performance Analytics (FR-RP-02) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Academic Performance & Grading Distribution
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      Overall Pass Rate: {academicAnalytics?.passRate ?? 0}%
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Avg Score: {academicAnalytics?.averageScore ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Summary Metric Cards */}
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Total Graded Submissions</p>
                      <p className="text-2xl font-bold text-indigo-950 mt-1">{academicAnalytics?.totalGraded || 0}</p>
                      <p className="text-xs text-indigo-600 mt-1">Evaluated across all examination terms</p>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Institutional Passing Rate</p>
                      <p className="text-2xl font-bold text-emerald-950 mt-1">{academicAnalytics?.passRate ?? 0}%</p>
                      <p className="text-xs text-emerald-600 mt-1">Students achieving Grade D or higher</p>
                    </div>

                    <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Mean Academic Score</p>
                      <p className="text-2xl font-bold text-violet-950 mt-1">{academicAnalytics?.averageScore ?? 0}%</p>
                      <p className="text-xs text-violet-600 mt-1">Average weighted percentage across subjects</p>
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  <div className="lg:col-span-2 h-64">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Grade Breakdown (A+ to F)
                    </p>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={academicAnalytics?.distribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                        <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 4: Student Demographics & Diversity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gender Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-600" />
                      Student Gender Ratio ({demographics?.totalEnrolled || 0} Total)
                    </h3>
                  </div>
                  <div className="h-60 flex items-center justify-center">
                    {demographics?.gender?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={demographics.gender}
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {(demographics.gender || []).map((entry, index) => {
                              const colors = ['#4F46E5', '#EC4899', '#9CA3AF']
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            })}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val} students`, 'Enrolled']} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-gray-400">No demographic data available.</p>
                    )}
                  </div>
                </div>

                {/* Age Group Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Age Group Distribution
                    </h3>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographics?.ageDistribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} students`, 'Headcount']} />
                        <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 5: Teacher Attendance & Faculty Overview */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Teacher & Faculty Performance Ledger
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                      Faculty Headcount: {teacherAnalytics?.totalFaculty || 0}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      Average Attendance: {teacherAnalytics?.averageAttendanceRate || 0}%
                    </span>
                  </div>
                </div>

                {(!teacherAnalytics?.teachers || teacherAnalytics.teachers.length === 0) ? (
                  <p className="py-6 text-center text-xs text-gray-400">No faculty records found.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5">Staff ID</th>
                          <th className="px-4 py-2.5">Teacher Name</th>
                          <th className="px-4 py-2.5">Designation</th>
                          <th className="px-4 py-2.5">Department</th>
                          <th className="px-4 py-2.5 text-center">Working Days</th>
                          <th className="px-4 py-2.5 text-center">Present Days</th>
                          <th className="px-4 py-2.5 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {teacherAnalytics.teachers.slice(0, 10).map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-gray-600">{t.staffId}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-900">{t.fullName}</td>
                            <td className="px-4 py-2.5 text-gray-600">{t.designation}</td>
                            <td className="px-4 py-2.5 text-gray-600">{t.department}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700">{t.totalDays}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700">{t.presentDays}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                t.attendanceRate >= 90
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : t.attendanceRate >= 75
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {t.attendanceRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Flagged Scholarship Review Candidates Modal */}
      {isReviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Merit Scholarship Academic Review</h3>
                  <p className="text-xs text-gray-500">Students receiving merit discounts with academic score below 70% threshold</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-3 flex-1 pr-1">
              {(!concessionAnalytics?.flaggedStudents || concessionAnalytics.flaggedStudents.length === 0) ? (
                <p className="py-8 text-center text-xs text-gray-400">All merit scholarship recipients currently meet the academic standard.</p>
              ) : (
                concessionAnalytics.flaggedStudents.map((s, idx) => (
                  <div key={idx} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{s.fullName}</span>
                        <span className="font-mono text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {s.studentId}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{s.className}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-gray-600">
                          Discount Awarded: <strong className="text-gray-900">{formatPKR(s.discountAmount)}</strong>
                        </span>
                        <span className="text-gray-600">
                          Guardian: <strong className="text-gray-900">{s.guardianPhone || 'N/A'}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                        {s.currentAverage}% Avg
                      </span>
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires Review</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {concessionAnalytics?.flaggedStudents?.length || 0} candidate(s) flagged for scholarship panel review
              </span>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
