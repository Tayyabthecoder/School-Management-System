import React from 'react'
import { Calendar } from 'lucide-react'
import { DAYS, PERIODS, PERIOD_TIMES } from './TeacherModals'

/** Schedule tab of the Teachers page. */
export default function TeacherScheduleTab({
  activeInspectorTeacher,
  inspectorScheduleMap,
  teachers,
  selectedTeacherScheduleId,
  setSelectedTeacherScheduleId,
}) {
  return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
              {/* Teacher selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Faculty Weekly Timetable Matrix</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Inspect periods or locate available free slots for proxy substitution</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Select Teacher:</label>
                  <select aria-label="Select Teacher"
                    value={selectedTeacherScheduleId}
                    onChange={(e) => setSelectedTeacherScheduleId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
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
                <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-x-auto shadow-sm">
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
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {DAYS.map((day) => (
                        <tr key={day} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 font-bold text-gray-800 dark:text-slate-100 bg-gray-50 dark:bg-slate-800/50 border-r border-gray-200 dark:border-slate-700">
                            {day}
                          </td>
                          {PERIODS.map((p) => {
                            const entry = inspectorScheduleMap[`${day}-${p}`]
                            return (
                              <td key={p} className="p-2 text-center border-r border-gray-200 dark:border-slate-700 last:border-0">
                                {entry ? (
                                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-left shadow-xs">
                                    <p className="font-bold text-indigo-900 dark:text-indigo-100 text-xs">
                                      {entry.subjectId?.name || 'Subject'}
                                    </p>
                                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold mt-0.5">
                                      {entry.classId?.name} — Sec {entry.sectionId}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{entry.room || 'Classroom'}</p>
                                  </div>
                                ) : (
                                  <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-xl">
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">✓ Free Slot</span>
                                    <span className="block text-[9px] text-emerald-700 dark:text-emerald-300 mt-0.5">Available for Proxy</span>
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
                <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">Select a faculty member above to view their schedule</div>
              )}
            </div>
          </div>
  )
}
