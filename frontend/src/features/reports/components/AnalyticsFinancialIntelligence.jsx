import React from 'react'
import { Clock, Wallet, CreditCard, Percent, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { formatPKR } from '../../../lib/formatters'
import ChartFrame from '../../../components/ui/ChartFrame'

const formatPct = (value) => (typeof value === 'number' ? `${value}%` : '—')

/** Financial intelligence and cash-flow forecast. */
export default function AnalyticsFinancialIntelligence({
  cashflowForecast,
  concessionAnalytics,
  paymentVelocity,
  setIsReviewDrawerOpen,
}) {
  return (
                  <div className="space-y-6">
                    {/* 1. Predictive Cash Flow & 90-Day Liquidity Forecast */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                        <div>
                          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Predictive Cash Flow & 90-Day Liquidity Forecast (Pillar 2)
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Empirical tuition inflow projections modeled against fixed monthly staff payroll obligations
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 px-3 py-1 rounded-full">
                            Monthly Payroll Obligation: {formatPKR(cashflowForecast.monthlyPayrollObligation || 0)}
                          </span>
                        </div>
                      </div>

                      {cashflowForecast.insufficientData && (
                        <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-100">
                          <p className="font-bold mb-1">Not enough history to forecast yet</p>
                          <p>
                            A forecast needs at least {cashflowForecast.basis?.minimumPaymentsRequired ?? 10} payments against due dates in the last 180 days,
                            plus fee records and active students. Found {cashflowForecast.basis?.paymentsAnalyzed ?? 0} payments,{' '}
                            {cashflowForecast.basis?.feeRecordsAnalyzed ?? 0} fee records and {cashflowForecast.basis?.activeStudents ?? 0} active students.
                          </p>
                        </div>
                      )}

                      {/* 3-Month Forecast Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {(cashflowForecast.forecast || []).map((m, idx) => (
                          <div key={m.month || idx} className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-linear-to-b from-gray-50/70 dark:from-slate-900 to-white dark:to-slate-900 flex flex-col justify-between shadow-2xs">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">{m.month}</span>
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                                  Based on {cashflowForecast.basis?.paymentsAnalyzed ?? 0} payments
                                </span>
                              </div>
                              <div className="space-y-1 mt-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 dark:text-slate-400">Gross Scheduled:</span>
                                  <span className="font-medium text-gray-800 dark:text-slate-100">{formatPKR(m.grossBillable)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 dark:text-slate-400">Concessions / Aid:</span>
                                  <span className="font-medium text-rose-600 dark:text-rose-400">-{formatPKR(m.concessions)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 dark:text-slate-400">Projected Inflow:</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatPKR(m.projectedInflow)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500 dark:text-slate-400">Payroll Liability:</span>
                                  <span className="font-medium text-gray-700 dark:text-slate-300">-{formatPKR(m.payrollLiability)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">Net Operating Margin:</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                m.netOperatingMargin >= 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}>
                                {m.netOperatingMargin >= 0 ? '+' : ''}{formatPKR(m.netOperatingMargin)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chart: Projected Inflow vs Payroll Liability */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                        <div className="lg:col-span-2 h-64">
                          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Projected Cash Inflow vs Mandatory Payroll Obligations
                          </p>
                          <ChartFrame label="Area chart: projected cash inflow versus payroll obligations">
                          <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={cashflowForecast.forecast || []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨ ${(v / 1000).toFixed(0)}k`} />
                              <Tooltip formatter={(value) => [formatPKR(value)]} />
                              <Legend verticalAlign="top" height={36} />
                              <Area
                                type="monotone"
                                dataKey="projectedInflow"
                                name="Projected Tuition Inflow"
                                stroke="#10B981"
                                fill="#D1FAE5"
                                strokeWidth={2}
                              />
                              <Area
                                type="monotone"
                                dataKey="payrollLiability"
                                name="Fixed Payroll Liability"
                                stroke="#F59E0B"
                                fill="#FEF3C7"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          </ChartFrame>
                        </div>

                        {/* Historical Collection Velocity Curve */}
                        <div className="p-4 bg-gray-50/70 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              Empirical Collection Velocity Curve
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">
                              Historical behavioral lag between Challan due dates and guardian bank/cash settlement
                            </p>

                            <div className="space-y-2.5">
                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">Early Settlers (Prior to Due Date)</span>
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatPct(cashflowForecast.historicalVelocity?.earlyPercentage)}</span>
                                </div>
                                <div className="w-full bg-emerald-100 dark:bg-emerald-900/40 rounded-full h-1.5">
                                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${formatPct(cashflowForecast.historicalVelocity?.earlyPercentage)}` }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-indigo-800 dark:text-indigo-200">Due Date Rush (1–10 Days)</span>
                                  <span className="font-bold text-indigo-700 dark:text-indigo-300">{formatPct(cashflowForecast.historicalVelocity?.onTimePercentage)}</span>
                                </div>
                                <div className="w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-full h-1.5">
                                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${formatPct(cashflowForecast.historicalVelocity?.onTimePercentage)}` }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-amber-800 dark:text-amber-200">Grace & Reminder Window (11–30 Days)</span>
                                  <span className="font-bold text-amber-700 dark:text-amber-300">{formatPct(cashflowForecast.historicalVelocity?.delayedPercentage)}</span>
                                </div>
                                <div className="w-full bg-amber-100 dark:bg-amber-900/40 rounded-full h-1.5">
                                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${formatPct(cashflowForecast.historicalVelocity?.delayedPercentage)}` }}></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="font-semibold text-rose-800 dark:text-rose-200">Chronic Delinquent Debt (&gt;30 Days)</span>
                                  <span className="font-bold text-rose-700 dark:text-rose-300">{formatPct(cashflowForecast.historicalVelocity?.delinquentPercentage)}</span>
                                </div>
                                <div className="w-full bg-rose-100 dark:bg-rose-900/40 rounded-full h-1.5">
                                  <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${formatPct(cashflowForecast.historicalVelocity?.delinquentPercentage)}` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-3 pt-2 border-t border-gray-200 dark:border-slate-700">
                            Data dynamically computed from 180-day empirical payment logs.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Concession & Scholarship Impact Matrix & ROI */}
                    {concessionAnalytics && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                          <div>
                            <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                              <Percent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              Institutional Concessions & Scholarship ROI Matrix
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              Tuition discounts awarded cross-referenced with beneficiary exam performance
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
                              Total Concessions: {formatPKR(concessionAnalytics.totalConcessionsAwarded || 0)}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                              Beneficiaries: {concessionAnalytics.beneficiaryCount || 0} students
                            </span>
                            {concessionAnalytics.flaggedStudents?.length > 0 && (
                              <button
                                onClick={() => setIsReviewDrawerOpen(true)}
                                className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {concessionAnalytics.flaggedStudents.length} Review Required
                              </button>
                            )}
                          </div>
                        </div>

                        {(!concessionAnalytics.categories || concessionAnalytics.categories.length === 0) ? (
                          <p className="py-6 text-center text-xs text-gray-500 dark:text-slate-400">No active scholarship or concession records found.</p>
                        ) : (
                          <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                  <th className="px-4 py-2.5">Concession / Aid Category</th>
                                  <th className="px-4 py-2.5 text-center">Student Beneficiaries</th>
                                  <th className="px-4 py-2.5 text-right">Total Concession Value</th>
                                  <th className="px-4 py-2.5 text-center">Cohort Academic Avg</th>
                                  <th className="px-4 py-2.5 text-right">Scholarship Review Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {concessionAnalytics.categories.map((c, idx) => (
                                  <tr key={c.type || idx} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-slate-100">{c.type}</td>
                                    <td className="px-4 py-2.5 text-center font-medium text-gray-700 dark:text-slate-300">{c.headcount}</td>
                                    <td className="px-4 py-2.5 text-right font-bold text-indigo-700 dark:text-indigo-300">{formatPKR(c.totalAmount)}</td>
                                    <td className="px-4 py-2.5 text-center font-bold text-gray-800 dark:text-slate-100">
                                      <span className={`inline-block px-2 py-0.5 rounded-md ${
                                        c.averageGradePercentage >= 75
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      }`}>
                                        {c.averageGradePercentage}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      {c.reviewRequiredCount > 0 ? (
                                        <button
                                          onClick={() => setIsReviewDrawerOpen(true)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                          {c.reviewRequiredCount} Below Benchmark
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                          <CheckCircle2 className="w-3 h-3" />
                                          Compliant
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Payment Recovery Channels & Settlement Latency */}
                    {paymentVelocity && (
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                          <div>
                            <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              Payment Recovery Channels & Settlement Latency
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              Tuition settlement velocity and digital payment adoption trends
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide">Median Days to Settle</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                              {paymentVelocity.medianDaysToSettle} <span className="text-xs font-normal text-gray-600 dark:text-slate-400">days after due</span>
                            </p>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">50% of guardians settle within this window</p>
                          </div>

                          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">On-Time Settlement Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                              {paymentVelocity.onTimeCollectionRate}%
                            </p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">Paid on or prior to official deadline</p>
                          </div>

                          <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl">
                            <p className="text-xs font-semibold text-teal-800 dark:text-teal-200 uppercase tracking-wide">Digital Payment Adoption</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">
                              {paymentVelocity.digitalAdoptionRate}%
                            </p>
                            <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">Settled via Bank Transfer, Online, JazzCash, or EasyPaisa</p>
                          </div>
                        </div>

                        {/* Payment Channels Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {(paymentVelocity.channelBreakdown || []).map((ch, idx) => (
                            <div key={ch.mode || idx} className="p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-center">
                              <p className="text-xs font-bold text-gray-800 dark:text-slate-100">{ch.mode}</p>
                              <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">{formatPKR(ch.totalAmount)}</p>
                              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{ch.transactionCount} transactions ({ch.share}%)</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
  )
}
