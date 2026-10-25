import React, { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, Users, Sparkles, ChevronRight, ArrowLeft, BookOpen, Calendar,
  Plus, Layers, Printer, CheckCircle2, Eye, ArrowRightLeft, Trash2
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { GRADE_THEMES, FALLBACK_GRADES as INITIAL_FALLBACK_GRADES } from '../../constants/grades'
import ChangeSectionModal from '../students/components/ChangeSectionModal'
import {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  AddSubjectModal,
  AssignPeriodModal,
  DeleteConfirmModal,
  AddClassModal,
  AddSectionModal,
} from './components/ClassModals'

export default function ClassesPage() {
  const toast = useToastStore()
  const { user } = useAuthStore()
  const userRole = user?.roleName || (typeof user?.role === 'object' ? user?.role?.name : user?.role) || ''
  const isSuperAdmin = userRole === 'super_admin'

  // State
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  // Drill-down State: 'grades' -> 'sections' -> 'details'
  const [navLevel, setNavLevel] = useState('grades')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  // Level 3 Details State
  const [classSubjects, setClassSubjects] = useState([])
  const [timetableEntries, setTimetableEntries] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false)
    const [newClassLevel, setNewClassLevel] = useState(13)
  const [newClassSections, setNewClassSections] = useState('A, B, C')
  
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
    
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [selectedSlotForAssign, setSelectedSlotForAssign] = useState(null)

  // Delete & Section Modals
  const [deleteClassModal, setDeleteClassModal] = useState({ open: false, classObj: null, deleting: false })
  const [deleteSectionModal, setDeleteSectionModal] = useState({ open: false, classObj: null, sectionName: '', deleting: false })
  const [changeSectionStudent, setChangeSectionStudent] = useState(null)

  const getClassStudentCount = (cls) => {
    if (!cls) return 0
    return students.filter(
      (s) =>
        s.classId &&
        (s.classId._id === cls._id || s.classId === cls._id || s.classId?.name === cls.name) &&
        s.status !== 'Withdrawn' &&
        !s.deletedAt
    ).length
  }

  const getSectionStudentCount = (cls, sec) => {
    if (!cls || !sec) return 0
    return students.filter(
      (s) =>
        s.classId &&
        (s.classId._id === cls._id || s.classId === cls._id || s.classId?.name === cls.name) &&
        s.sectionId === sec &&
        s.status !== 'Withdrawn' &&
        !s.deletedAt
    ).length
  }

  // Initial Load
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [clsRes, stuRes, tchRes] = await Promise.all([
        api.get('/classes'),
        api.get('/students', { params: { limit: 500 } }),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
      ])
      if (clsRes.data?.success && clsRes.data.data.length > 0) {
        setClasses(clsRes.data.data)
      } else {
        setClasses(INITIAL_FALLBACK_GRADES)
      }
      if (stuRes.data?.success) setStudents(stuRes.data.data)
      if (tchRes.data?.success) setTeachers(tchRes.data.data)
    } catch {
      setClasses(INITIAL_FALLBACK_GRADES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Load level 3 details (subjects & timetable)
  const loadSectionDetails = useCallback(async (grade, section) => {
    setLoadingDetails(true)
    try {
      const [subRes, ttRes] = await Promise.all([
        api.get('/subjects', { params: { classId: grade._id } }),
        api.get('/timetable', { params: { classId: grade._id, sectionId: section } }),
      ])

      if (subRes.data?.success) setClassSubjects(subRes.data.data)
      if (ttRes.data?.success) setTimetableEntries(ttRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to deactivate subject "${subjectName}"?`)) return
    try {
      const res = await api.delete(`/subjects/${subjectId}`)
      if (res.data?.success) {
        toast.success(`Subject "${subjectName}" deactivated`)
        loadSectionDetails(selectedGrade, selectedSection)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete subject')
    }
  }

  const handleSelectGrade = (cls) => {
    setSelectedGrade(cls)
    setSelectedSection(null)
    setNavLevel('sections')
  }

  const handleSelectSection = (sec) => {
    setSelectedSection(sec)
    setNavLevel('details')
    loadSectionDetails(selectedGrade, sec)
  }


  // Delete Class Handler
  const handleConfirmDeleteClass = async (force = false) => {
    if (!deleteClassModal.classObj) return
    const cls = deleteClassModal.classObj
    setDeleteClassModal((prev) => ({ ...prev, deleting: true }))
    try {
      if (cls._id && !cls._id.startsWith('fallback')) {
        await api.delete(`/classes/${cls._id}`, { params: { force } })
      } else {
        setClasses((prev) => prev.filter((c) => c._id !== cls._id && c.name !== cls.name))
      }
      toast.success(`Class "${cls.name}" deleted successfully`)
      setDeleteClassModal({ open: false, classObj: null, deleting: false })
      if (selectedGrade?._id === cls._id || selectedGrade?.name === cls.name) {
        setSelectedGrade(null)
        setSelectedSection(null)
        setNavLevel('grades')
      }
      fetchData()
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete class'
      toast.error(errMsg)
      setDeleteClassModal((prev) => ({ ...prev, deleting: false }))
    }
  }

  // Delete Section Handler
  const handleConfirmDeleteSection = async (force = false) => {
    if (!deleteSectionModal.classObj || !deleteSectionModal.sectionName) return
    const { classObj, sectionName } = deleteSectionModal
    setDeleteSectionModal((prev) => ({ ...prev, deleting: true }))
    try {
      if (classObj._id && !classObj._id.startsWith('fallback')) {
        const res = await api.delete(`/classes/${classObj._id}/sections/${encodeURIComponent(sectionName)}`, { params: { force } })
        if (res.data?.success && res.data?.data) {
          setSelectedGrade(res.data.data)
        }
      } else {
        const updatedSections = (classObj.sections || []).filter((s) => s !== sectionName)
        const updated = { ...classObj, sections: updatedSections }
        setSelectedGrade(updated)
        setClasses((prev) => prev.map((c) => (c._id === classObj._id ? updated : c)))
      }
      toast.success(`Section "${sectionName}" removed from "${classObj.name}"`)
      setDeleteSectionModal({ open: false, classObj: null, sectionName: '', deleting: false })
      if (selectedSection === sectionName) {
        setSelectedSection(null)
        setNavLevel('sections')
      }
      fetchData()
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete section'
      toast.error(errMsg)
      setDeleteSectionModal((prev) => ({ ...prev, deleting: false }))
    }
  }

  // Delete / Clear a Period Entry
  const handleDeletePeriod = async (entryId) => {
    try {
      const res = await api.delete(`/timetable/${entryId}`)
      if (res.data?.success) {
        toast.info('Period slot cleared')
        loadSectionDetails(selectedGrade, selectedSection)
      }
    } catch {
      toast.error('Failed to clear slot')
    }
  }

  // Map timetable entries by Day and PeriodNumber
  const timetableMap = {}
  timetableEntries.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`
    timetableMap[key] = entry
  })

  const displayClasses = classes && classes.length > 0 ? classes : INITIAL_FALLBACK_GRADES
  const sectionsToDisplay = selectedGrade?.sections && selectedGrade.sections.length > 0 ? selectedGrade.sections : ['A', 'B']

  return (
    <div>
      <Breadcrumb
        title="Academic Curriculum & Class Structure"
        subtitle="Manage academic grades, sections, curriculum subjects, and dynamic period timetables."
      />

      {/* Control Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Academic Class Structure
          </h2>
          <p className="text-xs text-gray-500">Configure academic grades, section rosters, and live curriculum schedules.</p>
        </div>

        <button
          onClick={() => setShowAddClassModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Class / Grade
        </button>
      </div>

      {/* ── LEVEL 1: GRADE CARDS ─────────────────────────────────────── */}
      {navLevel === 'grades' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Academic Grades ({displayClasses.length} Active)
              </h2>
              <p className="text-xs text-gray-500">Explore assigned subjects, section structures, and timetables per grade level.</p>
            </div>
            <Badge variant="indigo">{displayClasses.length} Total Classes</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayClasses.map((cls, index) => {
              const theme = GRADE_THEMES[index % GRADE_THEMES.length]
              const gradeStudents = students.filter(
                (s) => s.classId && (s.classId._id === cls._id || s.classId === cls._id || s.classId?.name === cls.name)
              ).length

              return (
                <div
                  key={cls._id || cls.name}
                  onClick={() => handleSelectGrade(cls)}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-lg ${theme.shadow} hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase">
                      Level {cls.level}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteClassModal({ open: true, classObj: cls, deleting: false })
                          }}
                          title={`Delete ${cls.name}`}
                          className="p-1.5 rounded-lg bg-black/20 hover:bg-red-600 text-white/90 hover:text-white transition-all backdrop-blur-xs shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <GraduationCap className="w-6 h-6 text-white/90" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-extrabold mb-1">{cls.name}</h3>
                  <p className="text-xs text-white/80 font-medium mb-4">
                    {cls.subjects ? `${cls.subjects.length} Subjects` : 'Core Curriculum'} • {cls.sections ? cls.sections.length : 2} Sections
                  </p>

                  <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {gradeStudents} Students
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Academics <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LEVEL 2: SECTION SELECTION ───────────────────────────────── */}
      {navLevel === 'sections' && selectedGrade && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setNavLevel('grades')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Grades
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">GRADE LEVEL {selectedGrade.level}</span>
                <h2 className="text-2xl font-extrabold text-gray-900">{selectedGrade.name} - Select Section</h2>
                <p className="text-xs text-gray-500 mt-1">Select a section to view its live timetable schedule and curriculum details.</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="indigo">{sectionsToDisplay.length} Sections Configured</Badge>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeleteClassModal({ open: true, classObj: selectedGrade, deleting: false })}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Class
                  </button>
                )}
                <button
                  onClick={() => setShowAddSectionModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sectionsToDisplay.map((sec) => {
                const secStudentsCount = students.filter(
                  (s) =>
                    s.classId &&
                    (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) &&
                    s.sectionId === sec
                ).length

                return (
                  <div
                    key={sec}
                    onClick={() => handleSelectSection(sec)}
                    className="bg-gray-50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                        {sec}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-full border text-gray-600">
                          Section {sec}
                        </span>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteSectionModal({ open: true, classObj: selectedGrade, sectionName: sec, deleting: false })
                            }}
                            title={`Delete Section ${sec}`}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {selectedGrade.name} - Section {sec}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" /> {secStudentsCount} Enrolled Students
                    </p>

                    <div className="w-full py-2 bg-white group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
                      Open Schedule & Subjects <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL 3: DYNAMIC SUBJECTS & TIMETABLE MATRIX ─────────────── */}
      {navLevel === 'details' && selectedGrade && selectedSection && (
        <div className="space-y-6">
          {/* Navigation Path */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNavLevel('sections')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sections
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setNavLevel('grades')} className="text-xs text-gray-500 hover:text-gray-800 font-medium">
                All Grades
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setDeleteSectionModal({ open: true, classObj: selectedGrade, sectionName: selectedSection, deleting: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" /> Delete Section {selectedSection}
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs"
              >
                <Printer className="w-4 h-4 text-gray-500" /> Print Schedule
              </button>
            </div>
          </div>

          {/* ── SECTION A: CURRICULUM SUBJECTS ───────────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Assigned Curriculum Subjects — {selectedGrade.name} (Section {selectedSection})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage active subjects, syllabus codes, and faculty assignments for this grade level.
                </p>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Subject to Class
              </button>
            </div>

            {loadingDetails ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : classSubjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classSubjects.map((sub, idx) => (
                  <div
                    key={sub._id || idx}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-indigo-300 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {sub.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                          <button
                            onClick={() => handleDeleteSubject(sub._id, sub.name)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Deactivate subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">{sub.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{sub.description || 'Core Academic Subject'}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Grade {selectedGrade.level}</span>
                      <button
                        onClick={() => setSelectedSlotForAssign({ subjectId: sub._id, dayOfWeek: 'Monday', periodNumber: 1 })}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Schedule Slot →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-2xl text-center border border-dashed border-gray-300">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No subjects configured for this grade yet</p>
                <p className="text-xs text-gray-400 mt-1">Click the "Add Subject to Class" button above to add subjects to the curriculum.</p>
              </div>
            )}
          </div>

          {/* ── SECTION B: DYNAMIC WEEKLY TIMETABLE MATRIX ─────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Weekly Timetable Matrix — {selectedGrade.name} (Section {selectedSection})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live period schedule mapped across Monday to Saturday. Click any slot to edit or assign.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedSlotForAssign({ dayOfWeek: 'Monday', periodNumber: 1 })}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Assign Slot
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <SkeletonTable rows={6} />
            ) : (
              <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-indigo-900 text-white">
                      <th className="p-3.5 font-bold w-28 border-r border-indigo-800">Day / Period</th>
                      {PERIODS.map((p) => (
                        <th key={p} className="p-3 font-bold text-center border-r border-indigo-800 last:border-0">
                          Period {p}
                          <span className="block text-[10px] font-normal text-indigo-300 mt-0.5">
                            {PERIOD_TIMES[p - 1].start} - {PERIOD_TIMES[p - 1].end}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {DAYS.map((day) => (
                      <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-gray-800 bg-gray-50 border-r border-gray-200">
                          {day}
                        </td>
                        {PERIODS.map((p) => {
                          const entry = timetableMap[`${day}-${p}`]
                          return (
                            <td key={p} className="p-2 border-r border-gray-200 last:border-0 group relative">
                              {entry ? (
                                <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-left hover:border-indigo-300 transition-all">
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="font-bold text-indigo-950 text-xs leading-tight">
                                      {entry.subjectId?.name || 'Subject'}
                                    </p>
                                    <button
                                      onClick={() => handleDeletePeriod(entry._id)}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity p-0.5"
                                      title="Clear slot"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-indigo-700 font-semibold mt-1 truncate">
                                    {entry.teacherId?.fullName || 'Faculty'}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{entry.room || 'Room 101'}</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSelectedSlotForAssign({ dayOfWeek: day, periodNumber: p })}
                                  className="w-full h-full min-h-[70px] p-2 bg-gray-50/60 hover:bg-indigo-50/50 border border-dashed border-gray-200 hover:border-indigo-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5 mb-0.5" />
                                  <span className="text-[10px] font-semibold">Assign</span>
                                </button>
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

          {/* ── SECTION C: ENROLLED STUDENTS ROSTER ──────────────────── */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Enrolled Students — {selectedGrade.name} (Section {selectedSection})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Roster of active students registered in this section. Super admins can reassign students to another section in {selectedGrade.name}.
                </p>
              </div>
              <Badge variant="indigo">
                {students.filter(
                  (s) =>
                    s.classId &&
                    (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) &&
                    s.sectionId === selectedSection &&
                    s.status !== 'Withdrawn' &&
                    !s.deletedAt
                ).length} Students Active
              </Badge>
            </div>

            {(() => {
              const currentSectionStudents = students.filter(
                (s) =>
                  s.classId &&
                  (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) &&
                  s.sectionId === selectedSection &&
                  s.status !== 'Withdrawn' &&
                  !s.deletedAt
              )

              return currentSectionStudents.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4">Student ID</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4">Guardian Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentSectionStudents.map((st) => (
                        <tr key={st._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                            {st.studentId || '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            {st.fullName}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{st.gender || '—'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {st.guardian?.name || '—'} ({st.guardian?.phone || '—'})
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {st.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`/students/${st._id}`}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </a>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setChangeSectionStudent(st)}
                                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                                  title="Change section within same class"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" /> Change Section
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-2xl text-center border border-dashed border-gray-300">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No students enrolled in this section yet</p>
                  <p className="text-xs text-gray-400 mt-1">Students enrolled in {selectedGrade.name} - Section {selectedSection} will appear here.</p>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      {/* 1. Add Subject Modal */}
      <AddSubjectModal
        open={showAddSubjectModal}
        classId={selectedGrade?._id}
        className={selectedGrade?.name}
        onClose={() => setShowAddSubjectModal(false)}
        onCreated={() => loadSectionDetails(selectedGrade, selectedSection)}
      />

      {/* 2. Assign Period Slot Modal */}
      <AssignPeriodModal
        open={!!selectedSlotForAssign}
        classId={selectedGrade?._id}
        sectionId={selectedSection}
        className={selectedGrade?.name}
        subjects={classSubjects}
        teachers={teachers}
        initialSlot={selectedSlotForAssign}
        onClose={() => setSelectedSlotForAssign(null)}
        onSaved={() => loadSectionDetails(selectedGrade, selectedSection)}
      />

      {/* 3. Add Class Modal */}
      <AddClassModal
        open={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onCreated={() => fetchData()}
      />

      {/* 4. Add Section Modal */}
      <AddSectionModal
        open={showAddSectionModal}
        grade={selectedGrade}
        onClose={() => setShowAddSectionModal(false)}
        onAdded={(updatedGrade) => {
          setSelectedGrade(updatedGrade)
          fetchData()
        }}
      />

      {/* 5. Delete Class Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteClassModal.open}
        title="Confirm Class Deletion"
        itemName={deleteClassModal.classObj?.name || 'Class'}
        itemType="class"
        studentCount={getClassStudentCount(deleteClassModal.classObj)}
        deleting={deleteClassModal.deleting}
        onClose={() => setDeleteClassModal({ open: false, classObj: null, deleting: false })}
        onConfirm={handleConfirmDeleteClass}
      />

      {/* 6. Delete Section Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteSectionModal.open}
        title="Confirm Section Deletion"
        itemName={`${deleteSectionModal.classObj?.name || 'Class'} - Section ${deleteSectionModal.sectionName}`}
        itemType="section"
        studentCount={getSectionStudentCount(deleteSectionModal.classObj, deleteSectionModal.sectionName)}
        deleting={deleteSectionModal.deleting}
        onClose={() => setDeleteSectionModal({ open: false, classObj: null, sectionName: '', deleting: false })}
        onConfirm={handleConfirmDeleteSection}
      />

      {/* 7. Change Student Section Modal */}
      <ChangeSectionModal
        open={Boolean(changeSectionStudent)}
        student={changeSectionStudent}
        currentClass={selectedGrade}
        classes={classes}
        onClose={() => setChangeSectionStudent(null)}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
