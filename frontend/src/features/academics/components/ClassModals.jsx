import React, { useState, useEffect } from 'react'
import {
  BookOpen, Plus, X, AlertCircle, Trash2
} from 'lucide-react'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]
export const PERIOD_TIMES = [
  { start: '08:00', end: '08:45' },
  { start: '08:45', end: '09:30' },
  { start: '09:30', end: '10:15' },
  { start: '10:15', end: '11:00' },
  { start: '11:30', end: '12:15' },
  { start: '12:15', end: '01:00' },
  { start: '01:00', end: '01:45' },
  { start: '01:45', end: '02:30' },
]

export // ─── Modal: Add Subject ───────────────────────────────────────────────────────
function AddSubjectModal({ open, classId, className, onClose, onCreated }) {
  const toast = useToastStore()
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: 'Core Curriculum',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/subjects', {
        ...form,
        classId,
        code: form.code.toUpperCase().trim(),
      })
      if (res.data?.success) {
        toast.success(`Subject "${form.name}" added to ${className}!`)
        onCreated(res.data.data)
        onClose()
        setForm({ name: '', code: '', description: 'Core Curriculum' })
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add subject')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-300" />
            <h3 className="font-bold text-base">Add Subject to {className}</h3>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Physics, Mathematics, Biology"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Code *</label>
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. PHY-10, MATH-10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Category</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Core Science Theory & Practical"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export // ─── Modal: Assign / Edit Period Slot ─────────────────────────────────────────
function AssignPeriodModal({
  open,
  classId,
  sectionId,
  className,
  subjects,
  teachers,
  initialSlot,
  onClose,
  onSaved,
}) {
  const toast = useToastStore()
  const [form, setForm] = useState({
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
    if (initialSlot) {
      setForm({
        subjectId: initialSlot.subjectId?._id || initialSlot.subjectId || (subjects[0]?._id || ''),
        teacherId: initialSlot.teacherId?._id || initialSlot.teacherId || (teachers[0]?._id || ''),
        dayOfWeek: initialSlot.dayOfWeek || 'Monday',
        periodNumber: initialSlot.periodNumber || 1,
        startTime: initialSlot.startTime || PERIOD_TIMES[(initialSlot.periodNumber || 1) - 1]?.start || '08:00',
        endTime: initialSlot.endTime || PERIOD_TIMES[(initialSlot.periodNumber || 1) - 1]?.end || '08:45',
        room: initialSlot.room || `Room ${className?.replace('Grade ', '') || '101'}`,
      })
    }
  }, [initialSlot, subjects, teachers, className])

  const handlePeriodChange = (pNum) => {
    const p = Number(pNum)
    setForm((prev) => ({
      ...prev,
      periodNumber: p,
      startTime: PERIOD_TIMES[p - 1]?.start || '08:00',
      endTime: PERIOD_TIMES[p - 1]?.end || '08:45',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/timetable', {
        ...form,
        classId,
        sectionId,
      })
      if (res.data?.success) {
        toast.success(`Period ${form.periodNumber} (${form.dayOfWeek}) scheduled successfully!`)
        onSaved(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save period schedule')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-6 bg-indigo-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Schedule Period Slot</h3>
            <p className="text-xs text-indigo-200">{className} — Section {sectionId}</p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-sm">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Day of Week *</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Period Number *</label>
              <select
                value={form.periodNumber}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>Period {p} ({PERIOD_TIMES[p - 1].start} - {PERIOD_TIMES[p - 1].end})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
              <select
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="">— Select Subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Faculty Teacher *</label>
              <select
                required
                value={form.teacherId}
                onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
              >
                <option value="">— Select Teacher —</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.fullName} ({t.designation || 'Faculty'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Room / Lab</label>
              <input
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Room 102, Science Lab"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Time Range</label>
              <div className="text-xs font-mono font-bold text-gray-700 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg">
                {form.startTime} — {form.endTime}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-60"
            >
              {saving ? 'Scheduling…' : 'Save Period Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export // ─── Modal: Confirm Deletion (Class or Section) ──────────────────────────────
function DeleteConfirmModal({
  open,
  title,
  itemName,
  itemType = 'class',
  studentCount = 0,
  onClose,
  onConfirm,
  deleting = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100">
        <div className="p-6 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700/60 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-xs text-red-100">Permanent Action • Super Admin Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-red-200 hover:text-white text-sm p-1 rounded-lg hover:bg-red-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-bold text-gray-900">{itemName}</span>?
          </p>

          {studentCount > 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-bold mb-1">
                  Enrolled Students Detected ({studentCount})
                </p>
                <p>
                  This {itemType} currently has <span className="font-bold">{studentCount}</span> active enrolled student(s). Deleting will remove all scheduled periods and withdraw associated student enrollment.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
              This {itemType} has no active enrolled students. Associated timetable periods and subject allocations will be permanently removed.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(studentCount > 0)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting…' : studentCount > 0 ? `Force Delete ${itemType === 'class' ? 'Class' : 'Section'}` : `Delete ${itemType === 'class' ? 'Class' : 'Section'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


export function AddClassModal({ open, onClose, onCreated }) {
  const toast = useToastStore()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)
  const [sections, setSections] = useState('A, B')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const sectionsArray = sections
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)

      const res = await api.post('/classes', {
        name,
        level: Number(level),
        sections: sectionsArray.length > 0 ? sectionsArray : ['A', 'B'],
      })

      if (res.data?.success) {
        toast.success(`Successfully created ${res.data.data.name}!`)
        onCreated?.(res.data.data)
        onClose()
        setName('')
        setLevel(1)
        setSections('A, B')
      }
    } catch {
      toast.error('Failed to create class')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Add New Academic Class
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Class / Grade Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grade 13 / A-Level Year 1"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Grade Level (Numeric)</label>
              <input
                type="number"
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Initial Sections</label>
              <input
                type="text"
                required
                value={sections}
                onChange={(e) => setSections(e.target.value)}
                placeholder="A, B, C"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddSectionModal({ open, grade, onClose, onAdded }) {
  const toast = useToastStore()
  const [sectionName, setSectionName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open || !grade) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sectionName) return
    setSubmitting(true)
    const secUpper = sectionName.trim().toUpperCase()

    try {
      if (!grade._id.startsWith('fallback')) {
        const res = await api.post(`/classes/${grade._id}/sections`, { sectionName: secUpper })
        if (res.data?.success) {
          onAdded?.(res.data.data)
        }
      }
      toast.success(`Section ${secUpper} added to ${grade.name}!`)
      onClose()
      setSectionName('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add section')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Add Section to {grade.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Section Identifier</label>
            <input
              type="text"
              required
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. C or D or Morning"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
            />
            <p className="text-[11px] text-gray-500 mt-1">Section will be converted to uppercase (e.g. Section C).</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
