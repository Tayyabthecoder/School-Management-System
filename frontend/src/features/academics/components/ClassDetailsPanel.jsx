import React from 'react'
import { Users, ArrowLeft, BookOpen, Calendar, Plus, Printer, CheckCircle2, Eye, ArrowRightLeft, Trash2 } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../../components/ui/Skeleton'
import { DAYS, PERIODS, PERIOD_TIMES } from './ClassModals'

/** Level 3 of the Classes page: a section's subjects, timetable matrix and student roster. */
export default function ClassDetailsPanel({
  userRole,
  isSuperAdmin,
  handleDeleteSubject,
  handleDeletePeriod,
  timetableMap,
  students,
  setNavLevel,
  selectedGrade,
  selectedSection,
  classSubjects,
  loadingDetails,
  setShowAddSubjectModal,
  setSelectedSlotForAssign,
  setDeleteSectionModal,
  setChangeSectionStudent,
}) {
  return (
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
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
                {userRole === 'super_admin' && (
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Subject to Class
                  </button>
                )}
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
                              className="text-gray-500 hover:text-red-600 p-1 transition-colors"
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
                        <span className="text-gray-500 font-medium">Grade {selectedGrade.level}</span>
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
                  <p className="text-xs text-gray-500 mt-1">Click the "Add Subject to Class" button above to add subjects to the curriculum.</p>
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
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 transition-opacity p-0.5"
                                        title="Clear slot"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-indigo-700 font-semibold mt-1 truncate">
                                      {entry.teacherId?.fullName || 'Faculty'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{entry.room || 'Room 101'}</p>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedSlotForAssign({ dayOfWeek: day, periodNumber: p })}
                                    className="w-full h-full min-h-[70px] p-2 bg-gray-50/60 hover:bg-indigo-50/50 border border-dashed border-gray-200 hover:border-indigo-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors"
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
                                    className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg inline-flex items-center gap-1 text-xs font-semibold transition-colors"
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
                    <p className="text-xs text-gray-500 mt-1">Students enrolled in {selectedGrade.name} - Section {selectedSection} will appear here.</p>
                  </div>
                )
              })()}
            </div>
          </div>
  )
}
