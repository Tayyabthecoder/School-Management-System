import React from 'react'
import { GraduationCap } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import ChartFrame from '../../../components/ui/ChartFrame'

/** Academic performance analytics. */
export default function AnalyticsAcademicPerformance({
  academicAnalytics,
}) {
  return (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                    <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Academic Performance & Grading Distribution
                    </h2>
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
                        Overall Pass Rate: {academicAnalytics?.passRate ?? 0}%
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                        Avg Score: {academicAnalytics?.averageScore ?? 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary Metric Cards */}
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Total Graded Submissions</p>
                        <p className="text-2xl font-bold text-indigo-950 dark:text-indigo-100 mt-1">{academicAnalytics?.totalGraded || 0}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Evaluated across all examination terms</p>
                      </div>

                      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Institutional Passing Rate</p>
                        <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1">{academicAnalytics?.passRate ?? 0}%</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Students achieving Grade D or higher</p>
                      </div>

                      <div className="p-4 bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 rounded-xl">
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Mean Academic Score</p>
                        <p className="text-2xl font-bold text-violet-950 dark:text-violet-100 mt-1">{academicAnalytics?.averageScore ?? 0}%</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Average weighted percentage across subjects</p>
                      </div>
                    </div>

                    {/* Distribution Chart */}
                    <div className="lg:col-span-2 h-64">
                      <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Grade Breakdown (A+ to F)
                      </p>
                      <ChartFrame label="Bar chart: number of students by grade letter, A+ to F">
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={academicAnalytics?.distribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                          <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  </div>
                </div>
  )
}
