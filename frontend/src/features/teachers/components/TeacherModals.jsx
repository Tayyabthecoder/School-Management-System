import React, { useState, useEffect } from 'react'
import { GraduationCap, Calendar, Clock, BookOpen, Layers } from 'lucide-react'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'
import { SkeletonTable } from '../../../components/ui/Skeleton'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
export const PERIOD_TIMES = [
  '08:00 - 08:45',
  '08:45 - 09:30',
  '09:30 - 10:15',
  '10:15 - 11:00',
  '11:30 - 12:15',
  '12:15 - 01:00',
  '01:00 - 01:45',
  '01:45 - 02:30',
]

// ─── Modal: Add Teacher ───────────────────────────────────────────────────────
export function AddTeacherModal({ open, onClose, onCreated }) {
  const toast = useToastStore()
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    designation: 'Senior Teacher',
    department: 'Academics',
    salary: 55000,
    qualification: 'M.Sc / M.Ed',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/teachers', form)
      if (res.data?.success) {
        toast.success(`Faculty member "${form.fullName}" onboarded successfully!`)
        onCreated(res.data.data)
        onClose()
        setForm({
          fullName: '',
          phone: '',
          email: '',
          designation: 'Senior Teacher',
          department: 'Academics',
          salary: 55000,
          qualification: 'M.Sc / M.Ed',
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to onboard teacher')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-lg font-bold">Onboard New Faculty Member</h2>
              <p className="text-xs text-indigo-200">Automatically creates teacher profile and portal account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Prof. Tariq Mahmood"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tariq@school.edu.pk"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
              <select
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option>Senior Teacher</option>
                <option>Subject Specialist</option>
                <option>Head of Department</option>
                <option>Assistant Teacher</option>
                <option>Lab Instructor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option>Academics</option>
                <option>Science & Math</option>
                <option>Languages</option>
                <option>Social Sciences</option>
                <option>Computer Science</option>
                <option>Sports & Physical Ed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Salary (PKR)</label>
              <input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="e.g. M.Phil Physics"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
            <strong>System Notice:</strong> Login credentials will be automatically generated with temporary password <code className="font-mono font-bold bg-amber-100 px-1 rounded">Teacher@1234</code>. Password rotation is enforced on first login.
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {saving ? 'Onboarding...' : 'Confirm & Create Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Assign Teacher to Class/Period ────────────────────────────────────
export function AssignPeriodModal({ open, teacher, classes, subjects, onClose, onAssigned }) {
  const toast = useToastStore()
  const [form, setForm] = useState({
    classId: '',
    sectionId: 'A',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'Monday',
    periodNumber: 1,
    startTime: '08:00',
    endTime: '08:45',
    room: 'Classroom',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (teacher) {
      setForm((prev) => ({ ...prev, teacherId: teacher._id }))
    }
  }, [teacher])

  const handleClassChange = (cId) => {
    setForm((prev) => ({ ...prev, classId: cId }))
  }

  const selectedClass = classes.find((c) => c._id === form.classId)
  const availableSections = selectedClass?.sections || ['A', 'B']
  const filteredSubjects = subjects.filter((s) => !form.classId || (s.classId?._id || s.classId) === form.classId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/teachers/assign', form)
      if (res.data?.success) {
        toast.success('Teaching assignment recorded successfully!')
        onAssigned(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !teacher) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-300" />
            <div>
              <h2 className="text-lg font-bold">Assign Subject & Period</h2>
              <p className="text-xs text-indigo-200">Assign {teacher.fullName} ({teacher.designation})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Class *</label>
              <select
                required
                value={form.classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Section *</label>
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {availableSections.map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject to Teach *</label>
              <select
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Day of Week *</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Period Slot *</label>
              <select
                value={form.periodNumber}
                onChange={(e) => {
                  const pNum = Number(e.target.value)
                  const slotTime = PERIOD_TIMES[pNum - 1]
                  const [start, end] = slotTime.split(' - ')
                  setForm({ ...form, periodNumber: pNum, startTime: start, endTime: end })
                }}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>Period {p} ({PERIOD_TIMES[p - 1]})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Classroom / Laboratory</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Physics Lab 2 or Room 14"
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {saving ? 'Assigning...' : 'Save Timetable Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Quick Teacher Schedule ────────────────────────────────────────────
export function TeacherScheduleModal({ open, teacher, onClose }) {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && teacher) {
      setLoading(true)
      api.get(`/teachers/${teacher._id}/schedule`)
        .then((res) => {
          if (res.data?.success) setSchedule(res.data.schedule || [])
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, teacher])

  if (!open || !teacher) return null

  // Map schedule by day and periodNumber
  const scheduleMap = {}
  schedule.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`
    scheduleMap[key] = entry
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-800 flex items-center justify-center font-bold text-lg text-indigo-200">
              {teacher.fullName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold">{teacher.fullName} — Weekly Timetable</h2>
              <p className="text-xs text-indigo-200">
                {teacher.designation} · Staff ID: {teacher.staffId} · {schedule.length} Periods / Week
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-sm">✕</button>
        </div>

        <div className="p-6">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-3 font-bold text-gray-700 w-28">Day / Period</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="p-3 font-bold text-gray-700 text-center">
                        P{p}
                        <span className="block text-[10px] font-normal text-gray-400">{PERIOD_TIMES[p - 1].split(' - ')[0]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {DAYS.map((day) => (
                    <tr key={day} className="hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-800 bg-gray-50/80">{day}</td>
                      {PERIODS.map((p) => {
                        const entry = scheduleMap[`${day}-${p}`]
                        return (
                          <td key={p} className="p-2 text-center border-l border-gray-100">
                            {entry ? (
                              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-left">
                                <p className="font-bold text-indigo-900 leading-tight">
                                  {entry.subjectId?.name || 'Subject'}
                                </p>
                                <p className="text-[10px] text-indigo-700 mt-0.5 font-medium">
                                  {entry.classId?.name} ({entry.sectionId})
                                </p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{entry.room || 'Classroom'}</p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300 font-mono">— Free —</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
