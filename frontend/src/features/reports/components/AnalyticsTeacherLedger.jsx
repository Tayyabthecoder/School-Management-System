import React from 'react'
import { Award } from 'lucide-react'

/** Teacher and faculty performance ledger. */
export default function AnalyticsTeacherLedger({
  teacherAnalytics,
}) {
  return (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
                    <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      Teacher & Faculty Performance Ledger
                    </h2>
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1 rounded-full">
                        Faculty Headcount: {teacherAnalytics?.totalFaculty || 0}
                      </span>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full">
                        Average Attendance: {teacherAnalytics?.averageAttendanceRate || 0}%
                      </span>
                    </div>
                  </div>

                  {(!teacherAnalytics?.teachers || teacherAnalytics.teachers.length === 0) ? (
                    <p className="py-6 text-center text-xs text-gray-500 dark:text-slate-400">No faculty records found.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-2.5">Staff ID</th>
                            <th className="px-4 py-2.5">Teacher Name</th>
                            <th className="px-4 py-2.5">Designation</th>
                            <th className="px-4 py-2.5">Department</th>
                            <th className="px-4 py-2.5 text-center">Working Days</th>
                            <th className="px-4 py-2.5 text-center">Present Days</th>
                            <th className="px-4 py-2.5 text-right">Attendance Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {teacherAnalytics.teachers.slice(0, 10).map((t) => (
                            <tr key={t._id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-2.5 font-mono text-gray-600 dark:text-slate-400">{t.staffId}</td>
                              <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-slate-100">{t.fullName}</td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400">{t.designation}</td>
                              <td className="px-4 py-2.5 text-gray-600 dark:text-slate-400">{t.department}</td>
                              <td className="px-4 py-2.5 text-center text-gray-700 dark:text-slate-300">{t.totalDays}</td>
                              <td className="px-4 py-2.5 text-center text-gray-700 dark:text-slate-300">{t.presentDays}</td>
                              <td className="px-4 py-2.5 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  t.attendanceRate >= 90
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : t.attendanceRate >= 75
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}>
                                  {t.attendanceRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
  )
}
