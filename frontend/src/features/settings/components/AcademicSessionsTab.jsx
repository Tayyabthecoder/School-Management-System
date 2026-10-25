import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Plus,
  Layers,
  Save,
  CalendarDays,
  Check,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import { SkeletonTable } from '../../../components/ui/Skeleton'
import { formatDate } from '../../../lib/formatters'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default function AcademicSessionsTab({
  academicYears,
  loadingAY,
  academicConfig,
  setAcademicConfig,
  onOpenAYModal,
  onSaveAcademicConfig,
  savingAcademic,
}) {
  const toast = useToastStore()
  const [allowedDays, setAllowedDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ])
  const [savingDays, setSavingDays] = useState(false)

  useEffect(() => {
    api.get('/settings/allowed-days')
      .then((res) => {
        if (res.data?.success && res.data.data?.allowedDays) {
          setAllowedDays(res.data.data.allowedDays)
        }
      })
      .catch(() => {})
  }, [])

  const handleToggleDay = (day) => {
    setAllowedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) {
          toast.warning('At least one school day must remain enabled.')
          return prev
        }
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  const handleSaveAllowedDays = async () => {
    setSavingDays(true)
    try {
      const res = await api.patch('/settings', { allowedDays })
      if (res.data?.success) {
        toast.success('School operating days updated successfully!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update operating days')
    } finally {
      setSavingDays(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── R6: School Operating Days Configuration ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              School Operating Days (Requirement R6)
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Specify active days for portal usage. Access is automatically restricted on non-school days.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={savingDays}
            onClick={handleSaveAllowedDays}
          >
            Save Operating Days
          </Button>
        </div>

        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Select Authorized Days of the Week:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = allowedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleToggleDay(day)}
                className={`py-3 px-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{day.slice(0, 3)}</span>
                </div>
                <span className="text-[10px] opacity-80 font-normal">
                  {isSelected ? 'Allowed' : 'Closed'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-150 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
          <span>
            Current policy allows portal usage on <strong>{allowedDays.length} days</strong> a week ({allowedDays.join(', ')}).
          </span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
            Super Admin Always Exempt
          </span>
        </div>
      </div>

      {/* ── Academic Sessions Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Academic Calendar & Sessions
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Manage session years and term schedules.</p>
          </div>
          <Button
            type="button"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenAYModal}
          >
            Add Academic Session
          </Button>
        </div>

        {loadingAY ? (
          <SkeletonTable rows={3} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {(academicYears || []).map((ay) => (
              <div key={ay._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-gray-900 dark:text-white text-base">Academic Session {ay.year}</span>
                    {ay.year === 2026 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold rounded-full">
                        Current Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Span: {ay.startDate ? formatDate(ay.startDate) : 'Jan 2026'} — {ay.endDate ? formatDate(ay.endDate) : 'Dec 2026'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg">
                    Terms: Term 1, Term 2, Midterm, Final
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic Policy Parameters */}
      <form onSubmit={onSaveAcademicConfig} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Academic Policies & Thresholds
          </h2>
          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={savingAcademic}
          >
            Save Policy
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Active Evaluation Term</label>
            <select
              value={academicConfig?.activeTerm || 'Term 1'}
              onChange={(e) => setAcademicConfig({ ...academicConfig, activeTerm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Midterm Examination</option>
              <option>Final Examination</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Passing Mark Threshold (%)</label>
            <input
              type="number"
              min={33}
              max={90}
              value={academicConfig?.passingPercentage ?? 50}
              onChange={(e) => setAcademicConfig({ ...academicConfig, passingPercentage: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Min Attendance Requirement (%)</label>
            <input
              type="number"
              min={50}
              max={95}
              value={academicConfig?.minAttendancePercentage ?? 75}
              onChange={(e) => setAcademicConfig({ ...academicConfig, minAttendancePercentage: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max Students / Section Cap</label>
            <input
              type="number"
              min={10}
              max={80}
              value={academicConfig?.maxStudentsPerSection ?? 35}
              onChange={(e) => setAcademicConfig({ ...academicConfig, maxStudentsPerSection: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Low Attendance Alert Threshold (%)</label>
            <input
              type="number"
              min={50}
              max={95}
              value={academicConfig?.attendanceAlertThreshold ?? 75}
              onChange={(e) => setAcademicConfig({ ...academicConfig, attendanceAlertThreshold: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex flex-col justify-center">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Automated Notifications</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={academicConfig?.autoFeeOverdueAlerts ?? true}
                onChange={(e) => setAcademicConfig({ ...academicConfig, autoFeeOverdueAlerts: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
              />
              Send Auto Overdue Fee Alerts
            </label>
          </div>
        </div>
      </form>
    </div>
  )
}
