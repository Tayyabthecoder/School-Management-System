import React from 'react'
import { BookOpen, Users } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import ChartFrame from '../../../components/ui/ChartFrame'

/** Gender and age-group charts. */
export default function DemographicsRow({
  demographics,
}) {
  return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gender Breakdown */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        Student Gender Ratio ({demographics?.totalEnrolled || 0} Total)
                      </h2>
                    </div>
                    <div className="h-60 flex items-center justify-center">
                      {demographics?.gender?.length ? (
                        <ChartFrame label="Pie chart: student gender ratio">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie rootTabIndex={-1}
                              data={demographics.gender}
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                              nameKey="name"
                            >
                              {(demographics.gender || []).map((entry, index) => {
                                const colors = ['#4F46E5', '#EC4899', '#9CA3AF']
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              })}
                            </Pie>
                            <Tooltip formatter={(val) => [`${val} students`, 'Enrolled']} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                        </ChartFrame>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-slate-400">No demographic data available.</p>
                      )}
                    </div>
                  </div>

                  {/* Age Group Distribution */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Age Group Distribution
                      </h2>
                    </div>
                    <div className="h-60">
                      <ChartFrame label="Bar chart: students by age group">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographics?.ageDistribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => [`${value} students`, 'Headcount']} />
                          <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  </div>
                </div>
  )
}
