import React, { useEffect, useState, useCallback } from 'react'
import { Award, ChevronRight, Download, Save, Search, BookOpen, FileText } from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { SkeletonGradeCards } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { useToastStore } from '../../store/toastStore'
import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'

const LETTER_COLORS = {
  'A+': 'bg-emerald-100 text-emerald-800',
  'A': 'bg-green-100 text-green-800',
  'B': 'bg-blue-100 text-blue-800',
  'C': 'bg-yellow-100 text-yellow-800',
  'D': 'bg-orange-100 text-orange-800',
  'F': 'bg-red-100 text-red-800',
}

function calcGradeLetter(pct) {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

// ─── Exam Create Modal ────────────────────────────────────────────────────────
function ExamModal({ open, onClose, grades, onCreated }) {
  const toast = useToastStore()
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
    Promise.all([api.get('/classes/subjects'), api.get('/classes/academic-years')])
      .then(([sRes, aRes]) => {
        if (sRes.data?.success) setSubjects(sRes.data.data)
        if (aRes.data?.success) setAcademicYears(aRes.data.data)
      })
      .catch(() => {})
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
              <input
                required
                placeholder="e.g. Midterm - Mathematics"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Term</label>
              <select
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
              <input
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
              <select
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
              <select
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
              <select
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
              <input
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

// ─── Grade Entry Table ────────────────────────────────────────────────────────
function GradeEntryTable({ students, exam }) {
  const toast = useToastStore()
  const [marks, setMarks] = useState({})
  const [existing, setExisting] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!exam) return
    const init = {}
    students.forEach((s) => { init[s._id] = 0 })
    setMarks(init)

    // Load existing grades for this exam
    api.get(`/grades/entry/${exam._id}`)
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
      .catch(() => {})
  }, [exam, students])

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
      console.error('Failed to download report card', err)
      toast.error('Failed to download report card')
    }
  }

  if (!exam) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Select an exam to enter marks</p>
        <p className="text-sm text-gray-400 mt-1">Choose from the exam selector above or create a new exam</p>
      </div>
    )
  }

  const avgPct = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (Number(marks[s._id] || 0) / exam.maxMarks) * 100, 0) / students.length)
    : 0

  const passing = students.filter((s) => (Number(marks[s._id] || 0) / exam.maxMarks) * 100 >= 50).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">{exam.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {exam.subjectId?.name || 'Subject'} · Max Marks: {exam.maxMarks} · {exam.termName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
            Class Avg: {avgPct}%
          </span>
          <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-semibold">
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
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Student</div>
        <div className="col-span-2 text-center">Marks Obtained</div>
        <div className="col-span-1 text-center">Percentage</div>
        <div className="col-span-1 text-center">Grade</div>
        <div className="col-span-3 text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {filtered.map((st, idx) => {
          const obtained = Number(marks[st._id] || 0)
          const pct = Math.round((obtained / exam.maxMarks) * 100)
          const letter = calcGradeLetter(pct)
          const isEdited = existing[st._id] && existing[st._id].marksObtained !== obtained
          return (
            <div key={st._id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-gray-50 transition-colors">
              <div className="col-span-1 text-sm text-gray-400 font-medium">{idx + 1}</div>
              <div className="col-span-4">
                <p className="font-semibold text-gray-800 text-sm">{st.fullName}</p>
                <p className="text-xs text-gray-400">{st.studentId}</p>
              </div>
              <div className="col-span-2 flex justify-center">
                <input
                  type="number"
                  min={0}
                  max={exam.maxMarks}
                  value={marks[st._id] ?? 0}
                  onChange={(e) => setMarks({ ...marks, [st._id]: Number(e.target.value) })}
                  className={`w-20 px-3 py-1.5 border rounded-lg text-sm text-center font-bold transition-colors ${
                    isEdited ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                />
                <span className="ml-1 text-xs text-gray-400 self-center">/{exam.maxMarks}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-sm font-bold ${pct >= 50 ? 'text-gray-700' : 'text-red-600'}`}>{pct}%</span>
              </div>
              <div className="col-span-1 text-center">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${LETTER_COLORS[letter] || 'bg-gray-100 text-gray-700'}`}>
                  {letter}
                </span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <button
                  onClick={() => handleDownload(st._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Report Card
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No students match your search</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GradesPage() {
  const toast = useToastStore()

  // View state: 'grades' | 'sections' | 'entry'
  const [view, setView] = useState('grades')
  const [grades, setGrades] = useState([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)
  const [students, setStudents] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [showExamModal, setShowExamModal] = useState(false)

  // Fetch grades & students
  useEffect(() => {
    Promise.all([
      api.get('/classes').catch(() => ({ data: { data: [] } })),
      api.get('/students?limit=500').catch(() => ({ data: { data: [] } })),
    ]).then(([gRes, sRes]) => {
      const loaded = gRes.data?.data?.length > 0 ? gRes.data.data : FALLBACK_GRADES
      setGrades(loaded)
      setAllStudents(sRes.data?.data || [])
      setLoadingGrades(false)
    })
  }, [])

  const getSectionsForGrade = useCallback((grade) => {
    const fromModel = grade.sections || []
    const fromStudents = [...new Set(
      allStudents
        .filter((s) => s.classId && (s.classId._id || s.classId) === grade._id)
        .map((s) => s.sectionId)
        .filter(Boolean)
    )]
    const merged = [...new Set([...fromModel, ...fromStudents])]
    return merged.length > 0 ? merged.sort() : ['A', 'B']
  }, [allStudents])

  const handleSelectGrade = (grade) => {
    setSelectedGrade(grade)
    setSelectedSection(null)
    setView('sections')
  }

  const handleSelectSection = (section) => {
    setSelectedSection(section)
    const sectionStudents = allStudents.filter(
      (s) =>
        (s.classId?._id || s.classId) === selectedGrade._id &&
        s.sectionId === section
    )
    setStudents(sectionStudents)

    // Fetch exams for this class
    api.get(`/grades/exams?classId=${selectedGrade._id}`)
      .then((res) => {
        if (res.data?.success) setExams(res.data.data)
      })
      .catch(() => toast.error('Could not load exams'))

    setView('entry')
  }

  const crumb =
    view === 'grades'
      ? [{ label: 'Grades & Exams' }]
      : view === 'sections'
      ? [
          { label: 'Grades & Exams', onClick: () => setView('grades') },
          { label: selectedGrade?.name },
        ]
      : [
          { label: 'Grades & Exams', onClick: () => setView('grades') },
          { label: selectedGrade?.name, onClick: () => setView('sections') },
          { label: `Section ${selectedSection}` },
        ]

  return (
    <div>
      <Breadcrumb
        title="Grades & Exam Management"
        subtitle="Record exam marks, auto-calculate grades, and export official PDF report cards."
      />

      {/* Breadcrumb Trail */}
      {view !== 'grades' && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          {crumb.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              {c.onClick ? (
                <button
                  onClick={c.onClick}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {c.label}
                </button>
              ) : (
                <span className="text-gray-800 font-semibold">{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* ── GRADE CARDS ─────────────────────────────────────────────── */}
      {view === 'grades' && (
        <>
          <div className="flex justify-between items-center mb-5">
            <p className="text-sm text-gray-500">Select a grade to enter exam marks</p>
            <button
              onClick={() => setShowExamModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Schedule New Exam
            </button>
          </div>

          {loadingGrades ? (
            <SkeletonGradeCards />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {grades.map((grade, i) => {
                const sections = getSectionsForGrade(grade)
                const studentCount = allStudents.filter(
                  (s) => (s.classId?._id || s.classId) === grade._id
                ).length
                return (
                  <button
                    key={grade._id}
                    onClick={() => handleSelectGrade(grade)}
                    className={`relative group bg-gradient-to-br ${GRADE_THEMES[i % GRADE_THEMES.length].gradient} ${GRADE_THEMES[i % GRADE_THEMES.length].shadow} text-white rounded-2xl p-5 text-left shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200`}
                  >
                    <Award className="w-7 h-7 opacity-80 mb-3" />
                    <p className="font-bold text-lg leading-tight">{grade.name}</p>
                    <p className="text-xs opacity-80 mt-1">
                      {sections.length} Section{sections.length !== 1 ? 's' : ''} · {studentCount} Students
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── SECTION CARDS ───────────────────────────────────────────── */}
      {view === 'sections' && selectedGrade && (
        <>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">{selectedGrade.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Select a section to enter exam marks</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {getSectionsForGrade(selectedGrade).map((section) => {
              const count = allStudents.filter(
                (s) =>
                  (s.classId?._id || s.classId) === selectedGrade._id &&
                  s.sectionId === section
              ).length
              return (
                <button
                  key={section}
                  onClick={() => handleSelectSection(section)}
                  className="bg-white border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-md group"
                >
                  <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center mb-3 transition-colors">
                    <span className="text-2xl font-black text-indigo-600">{section}</span>
                  </div>
                  <p className="font-bold text-gray-800">Section {section}</p>
                  <p className="text-xs text-gray-500 mt-1">{count} Students</p>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ── GRADE ENTRY ─────────────────────────────────────────────── */}
      {view === 'entry' && selectedGrade && selectedSection && (
        <>
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedGrade.name} — Section {selectedSection}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{students.length} students enrolled</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Exam Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Exam</label>
                <select
                  value={selectedExam?._id || ''}
                  onChange={(e) => {
                    const exam = exams.find((x) => x._id === e.target.value) || null
                    setSelectedExam(exam)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select Exam —</option>
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.title} ({ex.termName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowExamModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold text-sm rounded-lg"
                >
                  <FileText className="w-4 h-4" />
                  New Exam
                </button>
              </div>
            </div>
          </div>

          <GradeEntryTable students={students} exam={selectedExam} />
        </>
      )}

      {/* Exam Modal */}
      <ExamModal
        open={showExamModal}
        onClose={() => setShowExamModal(false)}
        grades={grades}
        onCreated={(exam) => {
          setExams((prev) => [exam, ...prev])
          setSelectedExam(exam)
        }}
      />
    </div>
  )
}
