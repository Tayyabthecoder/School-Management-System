import React from 'react'
import { Check, CheckCheck, XSquare, RotateCcw } from 'lucide-react'
import Button from '../../../components/ui/Button'

/** The register being marked. */
export default function AttendanceRegisterCard({
  handleDateChange,
  handleMarkAllPresent,
  handleMarkAllAbsent,
  handleInvertAttendance,
  handleStatusChange,
  handleSubmitAttendance,
  activeRoster,
  statusCounts,
  students,
  selectedGrade,
  selectedSection,
  attendanceDate,
  attendance,
  submitting,
}) {
  return (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {selectedGrade.name} · SECTION {selectedSection}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                        Student Attendance Checklist
                      </h2>
                      {/* Live Metric Breakdown */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Present: {statusCounts.Present}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Absent: {statusCounts.Absent}
                        </span>
                        {statusCounts.Late > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Late: {statusCounts.Late}
                          </span>
                        )}
                        {statusCounts.Excused > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Excused: {statusCounts.Excused}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={CheckCheck}
                        onClick={handleMarkAllPresent}
                        className="text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                      >
                        All Present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={XSquare}
                        onClick={handleMarkAllAbsent}
                        className="text-rose-700 hover:text-rose-800 bg-rose-50/70 hover:bg-rose-100/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
                      >
                        All Absent
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={RotateCcw}
                        onClick={handleInvertAttendance}
                        title="Invert Present / Absent status for all"
                      >
                        Invert
                      </Button>
                    </div>
                  </div>

                  {activeRoster.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs">
                      No students enrolled in this section.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 mt-4">
                      {activeRoster.map((student, idx) => {
                        const curStatus = attendance[student._id] || 'Present'
                        return (
                          <div
                            key={student._id}
                            className="py-3 flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-gray-100 font-bold text-gray-600 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold text-gray-900">{student.fullName}</p>
                                <p className="text-[10px] text-gray-500 font-mono">ID: {student.studentId} · Roll: {student.rollNumber || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex gap-1.5">
                              {['Present', 'Absent', 'Late', 'Excused'].map((st) => {
                                const isActive = curStatus === st
                                let btnColor = 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                if (isActive) {
                                  if (st === 'Present') btnColor = 'bg-green-600 text-white font-bold shadow-sm'
                                  if (st === 'Absent') btnColor = 'bg-red-600 text-white font-bold shadow-sm'
                                  if (st === 'Late') btnColor = 'bg-amber-700 text-white font-bold shadow-sm'
                                  if (st === 'Excused') btnColor = 'bg-blue-600 text-white font-bold shadow-sm'
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(student._id, st)}
                                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${btnColor}`}
                                  >
                                    {st}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="pt-6 mt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={handleSubmitAttendance}
                      disabled={submitting || activeRoster.length === 0}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {submitting ? 'Saving…' : `Save Attendance (${activeRoster.length} Students)`}
                    </button>
                  </div>
                </div>
  )
}
