import React, { useEffect, useState, useCallback } from 'react'
import { loadClasses } from '../../hooks/useClasses'
import { useAuthStore } from '../../store/authStore'
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
import { useToast } from '../../store/toastStore'
import {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  AddTeacherModal,
  AssignPeriodModal,
  TeacherScheduleModal,
} from './components/TeacherModals'
import { cachedGet } from '../../lib/cachedGet'
import { SUBJECT_COLORS } from './subjectColors'
import TeacherScheduleTab from './components/TeacherScheduleTab'
import TeacherMatrixTab from './components/TeacherMatrixTab'
import TeacherDirectoryTab from './components/TeacherDirectoryTab'

// ─── Constants ───────────────────────────────────────────────────────────────


// ─── Main Teachers Page ───────────────────────────────────────────────────────
export default function TeachersPage() {
  const authUser = useAuthStore((s) => s.user)
  // Only super_admin may assign teachers to periods (the API rejects teachers).
  const isAdmin = (authUser?.roleName || (typeof authUser?.role === 'object' ? authUser?.role?.name : authUser?.role)) === 'super_admin'
  const toast = useToast()

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
        cachedGet('/teachers'),
        loadClasses(),
        cachedGet('/classes/subjects'),
        cachedGet('/timetable').catch(() => ({ data: { data: [] } })),
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
        <TeacherDirectoryTab
          isAdmin={isAdmin}
          filteredTeachers={filteredTeachers}
          viewMode={viewMode}
          setViewMode={setViewMode}
          classes={classes}
          loading={loading}
          search={search}
          setSearch={setSearch}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          setSelectedTeacherForAssign={setSelectedTeacherForAssign}
          setSelectedTeacherForSchedule={setSelectedTeacherForSchedule}
        />
      )}

      {/* ── TAB 2: SUBJECT ALLOCATION MATRIX ─────────────────────────── */}
      {activeTab === 'matrix' && (
        <TeacherMatrixTab
          isAdmin={isAdmin}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          allTimetable={allTimetable}
          setSelectedTeacherForAssign={setSelectedTeacherForAssign}
        />
      )}

      {/* ── TAB 3: TIMETABLE & PROXY INSPECTOR ───────────────────────── */}
      {activeTab === 'schedule' && (
        <TeacherScheduleTab
          activeInspectorTeacher={activeInspectorTeacher}
          inspectorScheduleMap={inspectorScheduleMap}
          teachers={teachers}
          selectedTeacherScheduleId={selectedTeacherScheduleId}
          setSelectedTeacherScheduleId={setSelectedTeacherScheduleId}
        />
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
