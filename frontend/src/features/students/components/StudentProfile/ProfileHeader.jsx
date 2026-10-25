import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRightLeft,
  Edit3,
  Contact,
  Download,
  Activity,
  PhoneCall,
  MessageCircle,
  Upload,
  AlertCircle,
  User,
  BookOpen,
  Award,
  Calendar,
  CircleDollarSign,
  FileText,
} from 'lucide-react'
import Badge from '../../../../components/ui/Badge'
import { formatPKR, formatDate } from '../../../../lib/formatters'

export default function ProfileHeader({
  student,
  editMode,
  editForm,
  onToggleEdit,
  onOpenIdCard,
  onDownloadReportCard,
  onOpenStatusModal,
  onOpenChangeSection,
  onPhotoUpload,
  guardianPhone,
  whatsAppUrl,
  overallAvgPct,
  grades = [],
  attendanceStats,
  totalOutstanding,
  activeTab,
  onSelectTab,
}) {
  const tabs = [
    { id: 'personal', label: 'Personal & Family', icon: User },
    { id: 'academics', label: 'Enrolled Subjects', icon: BookOpen },
    { id: 'grades', label: 'Academic Grades & GPA', icon: Award },
    { id: 'attendance', label: 'Attendance Records', icon: Calendar },
    { id: 'fees', label: 'Fee Ledger & Payments', icon: CircleDollarSign },
    { id: 'documents', label: 'Documents & Verification', icon: FileText },
  ]

  return (
    <div>
      {/* ── Top Breadcrumb & Quick Actions Bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Roster
        </Link>

        {/* Quick Actions Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Profile Action */}
          <button
            onClick={onToggleEdit}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all ${
              editMode
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editMode ? 'Exit Edit Mode' : 'Edit Profile'}
          </button>

          {/* Digital ID Card */}
          <button
            onClick={onOpenIdCard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Contact className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Digital ID
          </button>

          {/* PDF Report Card */}
          <button
            onClick={onDownloadReportCard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Report Card (.pdf)
          </button>

          {/* Update Status Record */}
          <button
            onClick={onOpenStatusModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Status Record
          </button>

          {/* Change Section */}
          <button
            onClick={onOpenChangeSection}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Change Section
          </button>

          {/* Contact Guardian (Phone Call) */}
          {guardianPhone && (
            <a
              href={`tel:${guardianPhone}`}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl shadow-xs transition-colors"
              title={`Call Guardian: ${guardianPhone}`}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Guardian
            </a>
          )}

          {/* Contact Guardian (WhatsApp) */}
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl shadow-xs transition-colors"
              title="Open WhatsApp chat with Guardian"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* ── Top Hero Profile Banner ──────────────────────────────────── */}
      <div className="card-surface p-6 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {(editMode ? editForm?.photoUrl : student.photoUrl) ? (
                <img
                  src={editMode ? editForm?.photoUrl : student.photoUrl}
                  alt={student.fullName}
                  className="w-20 h-20 rounded-2xl object-cover shadow-md border-4 border-indigo-50 dark:border-indigo-950 shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-4 border-indigo-50 dark:border-indigo-950 shrink-0">
                  {student.fullName?.charAt(0) || 'S'}
                </div>
              )}

              {/* Photo Change Indicator in Edit Mode */}
              {editMode && (
                <label
                  htmlFor="profile-photo-upload"
                  className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                  title="Upload New Photo"
                >
                  <Upload className="w-5 h-5 mb-0.5" />
                  <span className="text-2xs font-bold">Change</span>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={onPhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {student.fullName || '—'}
                </h1>
                <Badge
                  variant={
                    student.status === 'Active'
                      ? 'success'
                      : student.status === 'Graduated'
                      ? 'primary'
                      : 'danger'
                  }
                >
                  {student.status || 'Active'}
                </Badge>
                {editMode && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-2xs font-bold rounded-md border border-amber-200 dark:border-amber-800">
                    Editing Mode Active
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  {student.studentId || '—'}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                  {student.classId?.name || 'Class'} — Section {student.sectionId || 'A'}
                  {onOpenChangeSection && (
                    <button
                      type="button"
                      onClick={onOpenChangeSection}
                      title="Change Student Section"
                      className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
                <span>•</span>
                <span>
                  Admitted: {student.joiningDate ? formatDate(student.joiningDate) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
              <p className="text-2xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Academic GPA
              </p>
              <p className="text-lg font-black text-indigo-900 dark:text-indigo-200 mt-0.5">
                {overallAvgPct !== null ? `${overallAvgPct}%` : '—'}
              </p>
              <span className="text-2xs font-semibold text-indigo-700 dark:text-indigo-400">
                {grades.length > 0
                  ? `${grades.length} Exam${grades.length > 1 ? 's' : ''}`
                  : 'No Grades'}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
              <p className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Attendance
              </p>
              <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                {attendanceStats?.attendancePct !== null
                  ? `${attendanceStats.attendancePct}%`
                  : '—'}
              </p>
              <span className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400">
                {attendanceStats?.totalAttended > 0
                  ? `${attendanceStats.totalAttended} Days Logged`
                  : '0 Records'}
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-800 text-center">
              <p className="text-2xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Fee Status
              </p>
              <p className="text-sm font-black text-amber-900 dark:text-amber-200 mt-1">
                {totalOutstanding === 0 ? 'Clear (Rs. 0)' : formatPKR(totalOutstanding)}
              </p>
              <span className="text-2xs font-semibold text-amber-700 dark:text-amber-400">
                {totalOutstanding === 0 ? 'Fully Paid' : 'Pending Due'}
              </span>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
              <p className="text-2xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Blood Group
              </p>
              <p className="text-lg font-black text-purple-900 dark:text-purple-200 mt-0.5">
                {student.bloodGroup || '—'}
              </p>
              <span className="text-2xs font-semibold text-purple-700 dark:text-purple-400">
                {student.bloodGroup ? 'Verified' : 'Unspecified'}
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Warning if Not Active */}
        {student.status !== 'Active' && student.transferReason && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>{student.status} Record:</strong> {student.transferReason} (Effective:{' '}
                {formatDate(student.transferDate)})
              </span>
            </div>
            <button
              onClick={onOpenStatusModal}
              className="text-xs font-bold text-amber-900 dark:text-amber-200 hover:underline"
            >
              Modify Status
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab?.(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-soft shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
