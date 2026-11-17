import React from 'react'
import { useEffect, useState } from 'react'
import api from '../../../lib/axios'
import { useToast } from '../../../store/toastStore'
import { logError } from '../../../lib/logger'
import { cachedGet } from '../../../lib/cachedGet'

// ─── Exam Create Modal ────────────────────────────────────────────────────────
export default function ExamModal({ open, onClose, grades, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: '',
    classId: '',
    subjectId: '',
    academicYearId: '',
    examDate: '',
    maxMarks: 100,
    termName: 'Term 1',
  })
  const [subjects, setSubjects] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    Promise.all([cachedGet('/classes/subjects'), cachedGet('/classes/academic-years')])
      .then(([sRes, aRes]) => {
        if (sRes.data?.success) setSubjects(sRes.data.data)
        if (aRes.data?.success) setAcademicYears(aRes.data.data)
      })
      .catch((err) => logError('Failed to load lookups for the exam form:', err))
  }, [open])

  const handle = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/grades/exams', form)
      if (res.data?.success) {
        toast.success(`Exam "${form.title}" created successfully!`)
        onCreated(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Schedule New Exam</h2>
          <p className="text-sm text-gray-500 mt-1">Create an exam entry to record student marks</p>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Title</label>
              <input aria-label="Exam Title"
                required
                placeholder="e.g. Midterm - Mathematics"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Term</label>
              <select aria-label="Term"
                value={form.termName}
                onChange={(e) => setForm({ ...form, termName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {['Term 1', 'Term 2', 'Midterm', 'Final'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Max Marks</label>
              <input aria-label="Max Marks"
                type="number"
                min={1}
                required
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Class / Grade</label>
              <select aria-label="Class / Grade"
                required
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
              <select aria-label="Subject"
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year</label>
              <select aria-label="Academic Year"
                required
                value={form.academicYearId}
                onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select Year</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>{y.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Date</label>
              <input aria-label="Exam Date"
                type="date"
                required
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
