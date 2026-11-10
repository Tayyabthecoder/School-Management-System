import React, { useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Users,
  UserCheck,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  Download,
  Clock,
  GraduationCap,
  Award,
} from 'lucide-react'
import api from '../../../lib/axios'
import { useToast } from '../../../store/toastStore'
import { downloadBlobResponse } from './downloadHelper'
import { useAuthStore } from '../../../store/authStore'
import { canExportEntity } from '../exportAccess'
import { logError } from '../../../lib/logger'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

export default function ExportReportsTab() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [feeFrom, setFeeFrom] = useState('')
  const [feeTo, setFeeTo] = useState('')
  const [attFrom, setAttFrom] = useState('')
  const [attTo, setAttTo] = useState('')
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1)
  const [payYear, setPayYear] = useState(new Date().getFullYear())
  const [loadingMap, setLoadingMap] = useState({})

  const setLoading = (key, val) => setLoadingMap((prev) => ({ ...prev, [key]: val }))

  const handleExport = async (key, url) => {
    setLoading(key, true)
    try {
      const endpoint = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url
      const response = await api.get(endpoint, { responseType: 'blob' })
      const ext = url.includes('format=pdf') ? 'pdf' : 'xlsx'
      await downloadBlobResponse(response, `${key}_${Date.now()}.${ext}`)
      toast.success('Report export downloaded successfully')
    } catch (err) {
      logError('Export failed:', err)
      let msg = 'Failed to generate report export'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          if (parsed?.error?.message) msg = parsed.error.message
        } catch (_) {
      // ignore error
    }
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message
      }
      toast.error(msg)
    } finally {
      setLoading(key, false)
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

  return (
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
            {canExportEntity(user, 'students') && (
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
            )}

            {canExportEntity(user, 'staff') && (
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
            )}

            {canExportEntity(user, 'fees') && (
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
            )}

            {canExportEntity(user, 'defaulters') && (
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
            )}

            {canExportEntity(user, 'attendance') && (
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
            )}

            {canExportEntity(user, 'staff-attendance') && (
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
            )}

            {canExportEntity(user, 'payroll') && (
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
            )}

            {canExportEntity(user, 'academic-performance') && (
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
            )}

            {canExportEntity(user, 'teacher-performance') && (
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
            )}
          </div>
        </div>
  )
}
