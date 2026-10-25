import React, { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  Search,
  Plus,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { useToastStore } from '../../store/toastStore'
import {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  AddTeacherModal,
  AssignPeriodModal,
  TeacherScheduleModal,
} from './components/TeacherModals'

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBJECT_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
]

// ─── Main Teachers Page ───────────────────────────────────────────────────────
export default function TeachersPage() {
  const toast = useToastStore()

  // State
  const [activeTab, setActiveTab] = useState('directory') // 'directory' | 'matrix' | 'schedule'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [allTimetable, setAllTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState(null)
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] = useState(null)
  const [selectedTeacherScheduleId, setSelectedTeacherScheduleId] = useState('')

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes, sRes, ttRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/classes'),
        api.get('/classes/subjects'),
        api.get('/timetable').catch(() => ({ data: { data: [] } })),
      ])

      if (tRes.data?.success) setTeachers(tRes.data.data)
      if (cRes.data?.success) setClasses(cRes.data.data)
      if (sRes.data?.success) setSubjects(sRes.data.data)
      if (ttRes.data?.success) setAllTimetable(ttRes.data.data)

      if (tRes.data?.data?.length > 0 && !selectedTeacherScheduleId) {
        setSelectedTeacherScheduleId(tRes.data.data[0]._id)
      }
    } catch {
      toast.error('Could not load teachers data')
    } finally {
      setLoading(false)
    }
  }, [toast, selectedTeacherScheduleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.staffId?.toLowerCase().includes(search.toLowerCase()) ||
      t.designation?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedSubjects?.some((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
    const matchesDept = filterDepartment === 'all' || t.department === filterDepartment
    return matchesSearch && matchesDept
  })

  // Summary Metrics
  const totalTeachers = teachers.length
  const totalAssignedPeriods = teachers.reduce((acc, t) => acc + (t.weeklyPeriodsCount || 0), 0)
  const avgLoad = totalTeachers > 0 ? (totalAssignedPeriods / totalTeachers).toFixed(1) : 0
  const activeFaculty = teachers.filter((t) => t.isActive).length

  // Inspector schedule for tab 3
  const activeInspectorTeacher = teachers.find((t) => t._id === selectedTeacherScheduleId)
  const inspectorSchedule = allTimetable.filter(
    (tt) => (tt.teacherId?._id || tt.teacherId) === selectedTeacherScheduleId
  )
  const inspectorScheduleMap = {}
  inspectorSchedule.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.periodNumber}`
    inspectorScheduleMap[key] = entry
  })

  return (
    <div>
      <Breadcrumb
        title="Teachers & Faculty Management"
        subtitle="Manage academic faculty, subject allocations, weekly teaching periods, and substitute coverage."
      />

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Faculty Members"
          value={loading ? '...' : totalTeachers}
          icon={GraduationCap}
          trend={`${activeFaculty} Active on Campus`}
          color="indigo"
        />
        <StatCard
          title="Weekly Assigned Periods"
          value={loading ? '...' : totalAssignedPeriods}
          icon={CalendarCheck}
          trend="Monday to Saturday"
          color="teal"
        />
        <StatCard
          title="Avg. Teaching Workload"
          value={loading ? '...' : `${avgLoad} p/wk`}
          icon={Clock}
          trend="Target: 24-28 periods"
          color="green"
        />
        <StatCard
          title="Subject Coverage Rate"
          value={loading ? '...' : '98.5%'}
          icon={Layers}
          trend="All 12 Grades Allocated"
          color="amber"
        />
      </div>

      {/* ── Tabs Header & Action Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'directory', label: 'Faculty Directory', icon: Users },
            { id: 'matrix', label: 'Subject Allocation Matrix', icon: BookOpen },
            { id: 'schedule', label: 'Timetable & Proxy Inspector', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Onboard Faculty Member
          </button>
        </div>
      </div>

      {/* ── TAB 1: FACULTY DIRECTORY ─────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculty by name, subject, ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Departments</option>
                <option value="Academics">Academics</option>
                <option value="Sciences">Sciences</option>
                <option value="Languages">Languages</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg border text-sm transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Directory Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeachers.map((teacher, idx) => (
                <div
                  key={teacher._id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {teacher.fullName?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight">{teacher.fullName}</h3>
                          <p className="text-xs text-indigo-600 font-semibold mt-0.5">{teacher.designation}</p>
                          <p className="text-[11px] text-gray-400">ID: {teacher.staffId}</p>
                        </div>
                      </div>
                      <Badge variant={teacher.isActive ? 'success' : 'secondary'}>
                        {teacher.isActive ? 'Active' : 'On Leave'}
                      </Badge>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-gray-600 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{teacher.phone || '+92 300 0000000'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{teacher.email || 'teacher@school.edu.pk'}</span>
                      </div>
                    </div>

                    {/* Assigned Subjects & Classes */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Subjects Taught ({teacher.assignedSubjects?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.assignedSubjects?.length > 0 ? (
                          teacher.assignedSubjects.map((sub, sIdx) => (
                            <span
                              key={sub._id || sIdx}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                SUBJECT_COLORS[sIdx % SUBJECT_COLORS.length]
                              }`}
                            >
                              {sub.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No subject allocations yet</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Assigned Grades ({teacher.assignedClasses?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses?.length > 0 ? (
                          teacher.assignedClasses.map((cls, cIdx) => (
                            <span
                              key={cls._id || cIdx}
                              className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium"
                            >
                              {cls.name} ({cls.section})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No classes assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{teacher.weeklyPeriodsCount || 0} periods/wk</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTeacherForSchedule(teacher)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Timetable
                      </button>
                      <button
                        onClick={() => setSelectedTeacherForAssign(teacher)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        + Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Faculty Member</div>
                <div className="col-span-3">Department & Role</div>
                <div className="col-span-2 text-center">Workload</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher._id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {teacher.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{teacher.fullName}</p>
                        <p className="text-xs text-gray-400">ID: {teacher.staffId} · {teacher.phone}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-gray-800 font-medium">{teacher.designation}</p>
                      <p className="text-xs text-gray-400">{teacher.department || 'Academics'}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {teacher.weeklyPeriodsCount || 0} periods/wk
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant={teacher.isActive ? 'success' : 'secondary'}>
                        {teacher.isActive ? 'Active' : 'Leave'}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedTeacherForSchedule(teacher)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => setSelectedTeacherForAssign(teacher)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SUBJECT ALLOCATION MATRIX ─────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Grade 1 to 12 Subject Faculty Allocations
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Overview of which teacher teaches each subject across classes and sections.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes.map((cls) => {
                const classSubjects = subjects.filter((s) => (s.classId?._id || s.classId) === cls._id)
                return (
                  <div key={cls._id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 hover:bg-white transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-gray-900 text-base">{cls.name}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                        Sections: {cls.sections?.join(', ') || 'A, B'}
                      </span>
                    </div>

                    <div className="space-y-2 mt-3">
                      {classSubjects.length > 0 ? (
                        classSubjects.map((sub) => {
                          const assignedEntry = allTimetable.find(
                            (tt) => (tt.classId?._id || tt.classId) === cls._id && (tt.subjectId?._id || tt.subjectId) === sub._id
                          )
                          const assignedTeacher = assignedEntry?.teacherId
                            ? (typeof assignedEntry.teacherId === 'object' ? assignedEntry.teacherId.fullName : assignedEntry.teacherId)
                            : null

                          return (
                            <div
                              key={sub._id}
                              className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 text-xs"
                            >
                              <div>
                                <p className="font-bold text-gray-800">{sub.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{sub.code}</p>
                              </div>
                              <div className="text-right">
                                {assignedTeacher ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {assignedTeacher}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedTeacherForAssign({ _id: teachers[0]?._id, fullName: 'Teacher' })}
                                    className="text-xs text-indigo-600 font-bold hover:underline"
                                  >
                                    + Assign Teacher
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2">No subjects configured for this grade</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TIMETABLE & PROXY INSPECTOR ───────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            {/* Teacher selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-gray-900">Faculty Weekly Timetable Matrix</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Inspect periods or locate available free slots for proxy substitution</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600">Select Teacher:</label>
                <select
                  value={selectedTeacherScheduleId}
                  onChange={(e) => setSelectedTeacherScheduleId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inspector Table */}
            {activeInspectorTeacher ? (
              <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-indigo-900 text-white">
                      <th className="p-3.5 font-bold w-32 border-r border-indigo-800">Day / Period</th>
                      {PERIODS.map((p) => (
                        <th key={p} className="p-3 font-bold text-center border-r border-indigo-800 last:border-0">
                          Period {p}
                          <span className="block text-[10px] font-normal text-indigo-300 mt-0.5">
                            {PERIOD_TIMES[p - 1]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {DAYS.map((day) => (
                      <tr key={day} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3.5 font-bold text-gray-800 bg-gray-50 border-r border-gray-200">
                          {day}
                        </td>
                        {PERIODS.map((p) => {
                          const entry = inspectorScheduleMap[`${day}-${p}`]
                          return (
                            <td key={p} className="p-2 text-center border-r border-gray-200 last:border-0">
                              {entry ? (
                                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-left shadow-xs">
                                  <p className="font-bold text-indigo-900 text-xs">
                                    {entry.subjectId?.name || 'Subject'}
                                  </p>
                                  <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                                    {entry.classId?.name} — Sec {entry.sectionId}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{entry.room || 'Classroom'}</p>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-emerald-50/60 border border-dashed border-emerald-200 rounded-xl">
                                  <span className="text-[10px] font-bold text-emerald-700">✓ Free Slot</span>
                                  <span className="block text-[9px] text-emerald-600 mt-0.5">Available for Proxy</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">Select a faculty member above to view their schedule</div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      <AddTeacherModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => loadData()}
      />

      <AssignPeriodModal
        open={!!selectedTeacherForAssign}
        teacher={selectedTeacherForAssign}
        classes={classes}
        subjects={subjects}
        onClose={() => setSelectedTeacherForAssign(null)}
        onAssigned={() => loadData()}
      />

      <TeacherScheduleModal
        open={!!selectedTeacherForSchedule}
        teacher={selectedTeacherForSchedule}
        onClose={() => setSelectedTeacherForSchedule(null)}
      />
    </div>
  )
}
