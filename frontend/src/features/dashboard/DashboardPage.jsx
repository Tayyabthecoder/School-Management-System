import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserCheck, Calendar, CircleDollarSign, Settings, TrendingUp, BookOpen, AlertTriangle,
  Clock, CheckCircle, FileText,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import Breadcrumb from '../../components/layout/Breadcrumb'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCard } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatPKR } from '../../lib/formatters'
import { useAuthStore } from '../../store/authStore'
import { connectSSE, disconnectSSE } from '../../lib/sseClient'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#10b981', '#f59e0b']
const BAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef',
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3.5 py-2 text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium mt-0.5">
            {p.name}: <span className="tabular-nums font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Role-Specific Quick Actions ──────────────────────────────────────────────
const QUICK_ACTIONS = {
  super_admin: [
    { label: 'Add New Student', icon: Users, path: '/students', color: 'indigo' },
    { label: 'Run Payroll', icon: CircleDollarSign, path: '/hr', color: 'green' },
    { label: 'View Reports', icon: TrendingUp, path: '/reports', color: 'teal' },
    { label: 'System Settings', icon: Settings, path: '/settings', color: 'amber' },
  ],
  teacher: [
    { label: 'Mark Attendance', icon: Calendar, path: '/attendance', color: 'green' },
    { label: 'Enter Grades', icon: BookOpen, path: '/grades', color: 'indigo' },
    { label: 'View Students', icon: Users, path: '/students', color: 'teal' },
  ],
  accountant: [
    { label: 'Record Payment', icon: CircleDollarSign, path: '/finance', color: 'green' },
    { label: 'Export Reports', icon: TrendingUp, path: '/reports', color: 'indigo' },
  ],
  hr_manager: [
    { label: 'View Staff', icon: UserCheck, path: '/hr', color: 'teal' },
    { label: 'Approve Leaves', icon: Calendar, path: '/hr', color: 'amber' },
  ],
  student: [
    { label: 'My Attendance', icon: Calendar, path: '/attendance', color: 'green' },
    { label: 'My Grades', icon: BookOpen, path: '/grades', color: 'indigo' },
    { label: 'Fee Status', icon: CircleDollarSign, path: '/finance', color: 'amber' },
  ],
}

const COLOR_MAP = {
  indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
  green: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
  teal: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200',
  amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()
  const userRole = user?.roleName || user?.role || 'student'

  const [stats, setStats] = useState(null)
  const [gradeData, setGradeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [attendanceTrend, setAttendanceTrend] = useState([])

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [statsRes, trendRes, enrollmentRes] = await Promise.allSettled([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/attendance-trend?days=7'),
          api.get('/reports/enrollment-by-grade'),
        ])

        if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
          setStats(statsRes.value.data.data)
        }

        if (trendRes.status === 'fulfilled' && trendRes.value.data?.success) {
          setAttendanceTrend(trendRes.value.data.data)
        }

        if (enrollmentRes.status === 'fulfilled' && enrollmentRes.value.data?.success) {
          const raw = enrollmentRes.value.data.data || []
          setGradeData(raw.map(item => ({
            ...item,
            grade: item.grade.replace('Grade ', 'G'),
          })))
        }
      } catch (err) {
        console.error('Dashboard load error', err)
      } finally {
        setLoading(false)
      }
    }

    loadAll()

    // Real-Time SSE listener (Gap 1)
    connectSSE((event) => {
      loadAll()
    })

    return () => {
      disconnectSSE()
    }
  }, [])

  const feeChartData = stats ? [
    { name: 'Collected', value: stats.totalCollections },
    { name: 'Outstanding', value: stats.totalOutstandingFees },
  ] : []

  const quickActions = QUICK_ACTIONS[userRole] || QUICK_ACTIONS['student']

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <Breadcrumb
          title={`Welcome back, ${user?.username || 'User'}! 👋`}
          subtitle={`Here's what's happening across your school today — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`}
        />
        {stats?.academicYear && (
          <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Session: {stats.academicYear}
          </span>
        )}
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : userRole === 'accountant' ? (
          <>
            <StatCard
              title="Total Collections"
              value={formatPKR(stats?.totalCollections ?? 0)}
              icon={CircleDollarSign}
              trend="Institutional revenue"
              color="green"
              sparklineData={stats?.sparklines?.fees || [0, 0, 0, 0, 0, 0, stats?.feeCollectionRate || 0]}
            />
            <StatCard
              title="Total Outstanding"
              value={formatPKR(stats?.totalOutstandingFees ?? 0)}
              icon={AlertTriangle}
              trend="Pending & Overdue dues"
              color="rose"
              sparklineData={[stats?.totalOutstandingFees || 0]}
            />
            <StatCard
              title="Fee Collection Rate"
              value={`${stats?.feeCollectionRate ?? 0}%`}
              icon={TrendingUp}
              trend="Target: 95% recovery"
              color="amber"
              sparklineData={stats?.sparklines?.fees || [0, 0, 0, 0, 0, 0, stats?.feeCollectionRate || 0]}
            />
            <StatCard
              title="Active Students"
              value={stats?.totalStudents ?? 0}
              icon={Users}
              trend="Fee-bearing profiles"
              color="indigo"
              sparklineData={stats?.sparklines?.totalStudents || [stats?.totalStudents || 0]}
            />
          </>
        ) : userRole === 'hr_manager' ? (
          <>
            <StatCard
              title="Total Staff Headcount"
              value={stats?.totalStaff ?? 0}
              icon={UserCheck}
              trend="Faculty & Administration"
              color="indigo"
              sparklineData={stats?.sparklines?.staffAttendance || [stats?.totalStaff || 0]}
            />
            <StatCard
              title="Staff Present Today"
              value={stats?.staffPresentToday ?? 0}
              icon={CheckCircle}
              trend="Checked in today"
              color="green"
              sparklineData={stats?.sparklines?.staffAttendance || [stats?.staffPresentToday || 0]}
            />
            <StatCard
              title="Staff On Leave Today"
              value={stats?.staffOnLeaveToday ?? 0}
              icon={Calendar}
              trend="Approved leaves"
              color="amber"
              sparklineData={[stats?.staffOnLeaveToday || 0]}
            />
            <StatCard
              title="Pending Leave Requests"
              value={stats?.pendingLeaveRequests ?? 0}
              icon={Clock}
              trend="Awaiting HR review"
              color="rose"
              sparklineData={[stats?.pendingLeaveRequests || 0]}
            />
          </>
        ) : userRole === 'teacher' ? (
          <>
            <StatCard
              title="Total Active Students"
              value={stats?.totalStudents ?? 0}
              icon={Users}
              trend="Active student roster"
              color="indigo"
              sparklineData={stats?.sparklines?.totalStudents || [stats?.totalStudents || 0]}
            />
            <StatCard
              title="Today's Attendance Rate"
              value={`${stats?.attendanceRate ?? 94}%`}
              icon={Calendar}
              trend="Target: 95%"
              color="green"
              sparklineData={stats?.sparklines?.attendanceRate || [90, 92, 94]}
            />
            <StatCard
              title="Total Faculty Roster"
              value={stats?.totalStaff ?? 0}
              icon={UserCheck}
              trend="Teaching departments"
              color="teal"
              sparklineData={stats?.sparklines?.staffAttendance || [stats?.totalStaff || 0]}
            />
            <StatCard
              title="Academic Term"
              value={stats?.academicYear || 'Current'}
              icon={BookOpen}
              trend="Active session"
              color="amber"
              sparklineData={[1, 1, 1, 1, 1, 1, 1]}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Active Students"
              value={stats?.totalStudents ?? 0}
              icon={Users}
              trend="Enrolled learners"
              color="indigo"
              sparklineData={stats?.sparklines?.totalStudents || [stats?.totalStudents || 0]}
            />
            <StatCard
              title="Today's Attendance Rate"
              value={`${stats?.attendanceRate ?? 94}%`}
              icon={Calendar}
              trend="Target: 95%"
              color="green"
              sparklineData={stats?.sparklines?.attendanceRate || [90, 92, 94]}
            />
            <StatCard
              title="Total Staff Headcount"
              value={stats?.totalStaff ?? 0}
              icon={UserCheck}
              trend="Academics & Admin"
              color="teal"
              sparklineData={stats?.sparklines?.staffAttendance || [stats?.totalStaff || 0]}
            />
            <StatCard
              title="Fee Collection Rate"
              value={`${stats?.feeCollectionRate ?? 0}%`}
              icon={CircleDollarSign}
              trend={stats?.totalCollections !== undefined ? formatPKR(stats?.totalCollections) : 'Institutional'}
              color="amber"
              sparklineData={stats?.sparklines?.fees || [stats?.feeCollectionRate || 0]}
            />
          </>
        )}
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <div className="card-surface p-5 mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                to={action.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xs hover:shadow-soft hover:-translate-y-0.5 transition-all ${COLOR_MAP[action.color]}`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Charts Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Students Per Grade Bar Chart */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enrollment by Grade</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Active enrolled students across all grades</p>
            </div>
            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-semibold border border-indigo-100 dark:border-indigo-900">
              Academic Year 2026
            </span>
          </div>
          {loading ? (
            <div className="h-52 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]}>
                  {gradeData.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fee Collection Pie Chart or Role-Specific Panel */}
        <div className="card-surface p-6">
          {stats?.totalCollections !== undefined ? (
            <>
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Fee Collection</h2>
                <p className="text-xs text-gray-400 mt-0.5">Collected vs outstanding</p>
              </div>
              {loading ? (
                <div className="h-52 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={feeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {feeChartData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatPKR(value)}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Collected</span>
                      <span className="font-bold text-green-700">{formatPKR(stats?.totalCollections)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Outstanding</span>
                      <span className="font-bold text-amber-700">{formatPKR(stats?.totalOutstandingFees)}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : userRole === 'hr_manager' ? (
            <>
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today's Staff Roster</h2>
                <p className="text-xs text-gray-400 mt-0.5">Staff presence & leave distribution</p>
              </div>
              <div className="h-44 flex flex-col justify-center space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Staff Present Today</span>
                  <span className="text-lg font-bold text-emerald-900">{stats?.staffPresentToday ?? 0}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800">Staff On Leave</span>
                  <span className="text-lg font-bold text-amber-900">{stats?.staffOnLeaveToday ?? 0}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800">Pending Leave Requests</span>
                  <span className="text-lg font-bold text-rose-900">{stats?.pendingLeaveRequests ?? 0}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Academic Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">Current term & attendance status</p>
              </div>
              <div className="h-44 flex flex-col justify-center space-y-3">
                <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-800">Active Academic Session</span>
                  <span className="text-sm font-bold text-indigo-900">{stats?.academicYear || 'Current'}</span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Campus Attendance Rate</span>
                  <span className="text-sm font-bold text-emerald-900">{stats?.attendanceRate ?? 94}%</span>
                </div>
                <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-800">Total Enrolled Students</span>
                  <span className="text-sm font-bold text-teal-900">{stats?.totalStudents ?? 0}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance Trend Line Chart */}
        <div className="lg:col-span-2 card-surface p-6">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attendance Trend</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Daily attendance rate — last 7 days</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={attendanceTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Line
                type="monotone"
                dataKey="rate"
                name="Attendance"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Institutional Notices */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Institutional Notices
            </h2>
          </div>
          <div className="space-y-2.5">
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">ACADEMICS</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Midterm Examinations Schedule</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Exams start next Monday across Grade 9 & 10.</p>
            </div>
            <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-xl border border-teal-100 dark:border-teal-900/40">
              <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">FINANCE</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Monthly Fee Clearance Deadline</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ensure all pending dues are recorded by the 10th.</p>
            </div>
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">ATTENDANCE</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Attendance Compliance Notice</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Maintain minimum 75% monthly attendance requirement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
