import React, { useEffect, useState, useCallback } from 'react'
import { loadClasses } from '../../hooks/useClasses'
import { Award, ChevronRight, Download, Save, Search, BookOpen, FileText, Send, CheckCircle2 } from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { SkeletonGradeCards } from '../../components/ui/Skeleton'
import { confirmAction } from '../../store/confirmStore'
import api from '../../lib/axios'
import { useToast } from '../../store/toastStore'
import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'
import { logError } from '../../lib/logger'
import { cachedGet } from '../../lib/cachedGet'
import ExamModal from './components/ExamModal'
import { LETTER_COLORS, calcGradeLetter } from './gradeLetters'
import GradeEntryTable from './components/GradeEntryTable'


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GradesPage() {
  const toast = useToast()

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
      loadClasses().catch(() => ({ data: { data: [] } })),
      cachedGet('/students?limit=1000').catch(() => ({ data: { data: [] } })),
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

  const handleSelectSection = async (section) => {
    setSelectedSection(section)

    // Immediate local in-memory fallback
    const localSectionStudents = allStudents.filter(
      (s) =>
        (s.classId?._id || s.classId) === selectedGrade._id &&
        s.sectionId === section
    )
    setStudents(localSectionStudents)

    // Dynamic section-scoped fetch guarantees all students loaded regardless of school population
    try {
      const stuRes = await cachedGet('/students', {
        params: {
          classId: selectedGrade._id,
          sectionId: section,
          limit: 1000,
          status: 'Active',
        },
      })
      if (stuRes.data?.success && Array.isArray(stuRes.data.data) && stuRes.data.data.length > 0) {
        setStudents(stuRes.data.data)
      }
    } catch {
      // Keep localSectionStudents fallback
    }

    // Fetch exams for this class
    cachedGet(`/grades/exams?classId=${selectedGrade._id}`)
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
        <nav aria-label="Grades drill-down path" className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          {crumb.map((c, i) => (
            <React.Fragment key={`${i}-${c.label}`}>
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
                <select aria-label="Exam"
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
                      {ex.title} ({ex.termName}){ex.isPublished ? '' : ' · Draft'}
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

          <GradeEntryTable
            students={students}
            exam={selectedExam}
            onExamUpdated={(updated) => {
              setExams((prev) => prev.map((ex) => (ex._id === updated._id ? updated : ex)))
              setSelectedExam(updated)
            }}
          />
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
