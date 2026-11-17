import React from 'react'
import { TrendingUp, Layers } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatPKR } from '../../../lib/formatters'
import ChartFrame from '../../../components/ui/ChartFrame'

/** Fee trend and collection-rate charts. */
export default function AnalyticsChartsRow({
  feeTrend,
  classCollection,
}) {
  return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1. Monthly Fee Collection Trend */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        6-Month Fee Revenue Trend
                      </h2>
                    </div>
                    <div className="h-64">
                      <ChartFrame label="Line chart: fee revenue by month over the last 6 months">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={feeTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨ ${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value) => [formatPKR(value), 'Collections']} />
                          <Line
                            type="monotone"
                            dataKey="collected"
                            stroke="#4F46E5"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4F46E5' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  </div>

                  {/* 2. Fee Collection Rate by Class */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Fee Collection Rate (%) by Grade
                      </h2>
                    </div>
                    <div className="h-64">
                      <ChartFrame label="Bar chart: fee collection rate by grade">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classCollection} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="className" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={45} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Collection Rate']} />
                          <Bar dataKey="collectionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  </div>
                </div>
  )
}
