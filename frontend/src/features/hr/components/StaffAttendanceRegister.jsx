import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { SkeletonTable } from '../../../components/ui/Skeleton'
import api from '../../../lib/axios'
import { useToast } from '../../../store/toastStore'

// Must match backend STAFF_ATTENDANCE_STATUSES (LOW-13). 'Leave' is the legacy spelling of 'On Leave'.
export const STAFF_STATUSES = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave']

const STATUS_STYLES = {
  Present: 'bg-emerald-600 text-white border-emerald-600',
  Late: 'bg-amber-500 text-white border-amber-500',
  'Half Day': 'bg-sky-600 text-white border-sky-600',
  Absent: 'bg-rose-600 text-white border-rose-600',
  'On Leave': 'bg-violet-600 text-white border-violet-600',
}

const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * FUNC-03: HR marks daily staff attendance. Absences recorded here feed the payroll
 * absence deduction (which was always 0 while there was no way to mark them).
 */
export default function StaffAttendanceRegister({ staff = [] }) {
  const toast = useToast()
  const [date, setDate] = useState(todayLocal)
  const [statusByStaff, setStatusByStaff] = useState({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)

  const activeStaff = useMemo(() => staff.filter((s) => s.isActive !== false), [staff])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/staff?date=${date}`)
      const map = {}
      for (const rec of res.data?.data || []) {
        const id = rec.staffId?._id || rec.staffId
        if (id) map[id] = rec.status === 'Leave' ? 'On Leave' : rec.status
      }
      setStatusByStaff(map)
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not load staff attendance')
    } finally {
      setLoading(false)
    }
  }, [date, toast])

  useEffect(() => { load() }, [load])

  const mark = async (staffMember, status) => {
    const previous = statusByStaff[staffMember._id]
    setStatusByStaff((prev) => ({ ...prev, [staffMember._id]: status }))
    setSavingId(staffMember._id)
    try {
      await api.post('/attendance/staff', { staffId: staffMember._id, date, status })
    } catch (err) {
      setStatusByStaff((prev) => ({ ...prev, [staffMember._id]: previous }))
      toast.error(err.response?.data?.error?.message || `Could not save attendance for ${staffMember.fullName}`)
    } finally {
      setSavingId(null)
    }
  }

  const markedCount = activeStaff.filter((s) => statusByStaff[s._id]).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-indigo-500" />
            Staff Attendance Register
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {markedCount} of {activeStaff.length} marked. Each choice saves immediately; absences and half days reduce payroll.
          </p>
        </div>
        <input
          type="date"
          value={date}
          max={todayLocal()}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          aria-label="Attendance date"
        />
      </div>
      {loading ? (
        <div className="p-6"><SkeletonTable rows={4} /></div>
      ) : activeStaff.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No active staff members</div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
          {activeStaff.map((s) => (
            <div key={s._id} className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{s.fullName}</p>
                <p className="text-xs text-gray-400">{s.staffId} · {s.designation}</p>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Attendance for ${s.fullName}`}>
                {STAFF_STATUSES.map((status) => {
                  const selected = statusByStaff[s._id] === status
                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={savingId === s._id}
                      aria-pressed={selected}
                      onClick={() => !selected && mark(s, status)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${
                        selected ? STATUS_STYLES[status] : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
