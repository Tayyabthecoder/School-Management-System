import React, { useEffect, useState } from 'react'
import { Download, Save, Search, BookOpen, Send, CheckCircle2 } from 'lucide-react'
import { confirmAction } from '../../../store/confirmStore'
import api from '../../../lib/axios'
import { useToast } from '../../../store/toastStore'
import { logError } from '../../../lib/logger'
import { cachedGet } from '../../../lib/cachedGet'
import { LETTER_COLORS, calcGradeLetter } from '../gradeLetters'

// ─── Grade Entry Table ────────────────────────────────────────────────────────
export default function GradeEntryTable({ students, exam, onExamUpdated }) {
  const toast = useToast()
  const [marks, setMarks] = useState({})
  const [existing, setExisting] = useState({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Students, guardians, report cards and transcripts only show published exams, so
  // results stay invisible to families until a teacher/admin publishes them here.
  const handlePublish = async () => {
    if (!exam || exam.isPublished) return
    const confirmed = await confirmAction({
      title: 'Publish results',
      message: `Publish "${exam.title}" results? Students and guardians will be able to see these marks.`,
      confirmLabel: 'Publish',
    })
    if (!confirmed) return
    setPublishing(true)
    try {
      const res = await api.patch(`/grades/exams/${exam._id}/publish`)
      if (res.data?.success) {
        toast.success('Results published to student and guardian portals')
        onExamUpdated?.(res.data.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to publish results')
    } finally {
      setPublishing(false)
    }
  }
  const [search, setSearch] = useState('')

  // Keyed on the exam id, not the object: publishing replaces the exam object and must
  // not wipe marks the teacher has typed but not yet saved.
  const examId = exam?._id
  useEffect(() => {
    if (!examId) return
    const init = {}
    students.forEach((s) => { init[s._id] = 0 })
    setMarks(init)

    // Load existing grades for this exam
    cachedGet(`/grades/entry/${examId}`)
      .then((res) => {
        if (res.data?.success) {
          const existMap = {}
          const marksMap = {}
          res.data.data.forEach((g) => {
            if (g.studentId) {
              const sid = typeof g.studentId === 'object' ? g.studentId._id : g.studentId
              existMap[sid] = g
              marksMap[sid] = g.marksObtained
            }
          })
          setExisting(existMap)
          setMarks((prev) => ({ ...prev, ...marksMap }))
        }
      })
      .catch((err) => logError('Failed to load existing marks:', err))
  }, [examId, students])

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!exam) return
    setSaving(true)
    try {
      const gradesPayload = students.map((s) => ({
        studentId: s._id,
        marksObtained: Number(marks[s._id] || 0),
      }))
      const res = await api.post('/grades/entry', { examId: exam._id, grades: gradesPayload })
      if (res.data?.success) {
        toast.success(`Grades saved successfully for ${res.data.data.length} students!`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (studentId) => {
    const student = students.find((s) => s._id === studentId)
    const term = exam?.termName || 'Term 1'
    try {
      toast.info(`Generating report card for ${student?.fullName || 'student'}...`)
      const res = await api.get(`/grades/report-card?studentId=${studentId}&termName=${encodeURIComponent(term)}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `ReportCard-${(student?.fullName || studentId).replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('Report card downloaded successfully')
    } catch (err) {
      logError('Failed to download report card', err)
      toast.error('Failed to download report card')
    }
  }

  if (!exam) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">Select an exam to enter marks</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Choose from the exam selector above or create a new exam</p>
      </div>
    )
  }

  const avgPct = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (Number(marks[s._id] || 0) / exam.maxMarks) * 100, 0) / students.length)
    : 0

  const passing = students.filter((s) => (Number(marks[s._id] || 0) / exam.maxMarks) * 100 >= 50).length

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-slate-100">{exam.title}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {exam.subjectId?.name || 'Subject'} · Max Marks: {exam.maxMarks} · {exam.termName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold">
            Class Avg: {avgPct}%
          </span>
          <span className="text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
            Passing: {passing}/{students.length}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save All Grades'}
          </button>
          {exam.isPublished ? (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Published
            </span>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing…' : 'Publish Results'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-slate-400" />
          <input aria-label="Search student…"
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Student</div>
        <div className="col-span-2 text-center">Marks Obtained</div>
        <div className="col-span-1 text-center">Percentage</div>
        <div className="col-span-1 text-center">Grade</div>
        <div className="col-span-3 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {filtered.map((st, idx) => {
          const obtained = Number(marks[st._id] || 0)
          const pct = Math.round((obtained / exam.maxMarks) * 100)
          const letter = calcGradeLetter(pct)
          const isEdited = existing[st._id] && existing[st._id].marksObtained !== obtained
          return (
            <div key={st._id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="col-span-1 text-sm text-gray-500 dark:text-slate-400 font-medium">{idx + 1}</div>
              <div className="col-span-4">
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">{st.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{st.studentId}</p>
              </div>
              <div className="col-span-2 flex justify-center">
                <input
                  type="number"
                  min={0}
                  max={exam.maxMarks}
                  value={marks[st._id] ?? 0}
                  onChange={(e) => setMarks({ ...marks, [st._id]: Number(e.target.value) })}
                  className={`w-20 px-3 py-1.5 border rounded-lg text-sm text-center font-bold transition-colors ${
                    isEdited ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'border-gray-300 dark:border-slate-600'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                <span className="ml-1 text-xs text-gray-500 dark:text-slate-400 self-center">/{exam.maxMarks}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-sm font-bold ${pct >= 50 ? 'text-gray-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>{pct}%</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${LETTER_COLORS[letter] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'}`}>
                  {letter}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <button
                  onClick={() => handleDownload(st._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Report Card
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">No students match your search</div>
        )}
      </div>
    </div>
  )
}
