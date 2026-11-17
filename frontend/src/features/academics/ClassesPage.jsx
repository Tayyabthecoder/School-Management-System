import React, { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, Users, Sparkles, ChevronRight, ArrowLeft, BookOpen, Calendar,
  Plus, Layers, Printer, CheckCircle2, Eye, ArrowRightLeft, Trash2
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { confirmAction } from '../../store/confirmStore'
import api from '../../lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { CLASSES_KEY } from '../../hooks/useClasses'
import { useToast } from '../../store/toastStore'
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
import { logError } from '../../lib/logger'
import { cachedGet } from '../../lib/cachedGet'
import ClassDetailsPanel from './components/ClassDetailsPanel'

export default function ClassesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
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
        cachedGet('/classes'),
        cachedGet('/students', { params: { limit: 500 } }),
        cachedGet('/teachers').catch(() => ({ data: { data: [] } })),
      ])
      if (clsRes.data?.success && clsRes.data.data.length > 0) {
        setClasses(clsRes.data.data)
        // Every other page reading the class list sees the change without waiting for expiry
        queryClient.setQueryData(CLASSES_KEY, clsRes.data.data)
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
  }, [queryClient])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Load level 3 details (subjects & timetable)
  const loadSectionDetails = useCallback(async (grade, section) => {
    setLoadingDetails(true)
    try {
      const [subRes, ttRes] = await Promise.all([
        cachedGet('/subjects', { params: { classId: grade._id } }),
        cachedGet('/timetable', { params: { classId: grade._id, sectionId: section } }),
      ])

      if (subRes.data?.success) setClassSubjects(subRes.data.data)
      if (ttRes.data?.success) setTimetableEntries(ttRes.data.data)
    } catch (err) {
      logError(err)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!(await confirmAction({ title: 'Deactivate subject', message: `Are you sure you want to deactivate subject "${subjectName}"?`, confirmLabel: 'Deactivate', danger: true }))) return
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
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Academic Class Structure
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">Configure academic grades, section rosters, and live curriculum schedules.</p>
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Academic Grades ({displayClasses.length} Active)
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Explore assigned subjects, section structures, and timetables per grade level.</p>
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
                    <span className="px-2.5 py-1 rounded-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-xs font-bold uppercase">
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Grades
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">GRADE LEVEL {selectedGrade.level}</span>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{selectedGrade.name} - Select Section</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Select a section to view its live timetable schedule and curriculum details.</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="indigo">{sectionsToDisplay.length} Sections Configured</Badge>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => setDeleteClassModal({ open: true, classObj: selectedGrade, deleting: false })}
                    className="px-3.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-1.5 transition-all shadow-xs"
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
                    className="bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                        {sec}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border text-gray-600 dark:text-slate-400">
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
                            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                      {selectedGrade.name} - Section {sec}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> {secStudentsCount} Enrolled Students
                    </p>

                    <div className="w-full py-2 bg-white dark:bg-slate-900 group-hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
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
        <ClassDetailsPanel
          userRole={userRole}
          isSuperAdmin={isSuperAdmin}
          handleDeleteSubject={handleDeleteSubject}
          handleDeletePeriod={handleDeletePeriod}
          timetableMap={timetableMap}
          students={students}
          setNavLevel={setNavLevel}
          selectedGrade={selectedGrade}
          selectedSection={selectedSection}
          classSubjects={classSubjects}
          loadingDetails={loadingDetails}
          setShowAddSubjectModal={setShowAddSubjectModal}
          setSelectedSlotForAssign={setSelectedSlotForAssign}
          setDeleteSectionModal={setDeleteSectionModal}
          setChangeSectionStudent={setChangeSectionStudent}
        />
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
