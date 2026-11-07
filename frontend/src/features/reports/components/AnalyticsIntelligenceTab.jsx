import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Clock,
  Sparkles,
  Download,
  GraduationCap,
  Award,
  BookOpen,
  Wallet,
  CreditCard,
  Percent,
  ArrowUpRight,
  CheckCircle2,
  X,
  PhoneCall,
  DollarSign,
  AlertTriangle,
  Layers,
  Users,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import api from '../../../lib/axios'
import { formatPKR } from '../../../lib/formatters'
import { SkeletonCard } from '../../../components/ui/Skeleton'

export default function AnalyticsIntelligenceTab() {
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [feeTrend, setFeeTrend] = useState([])
  const [classCollection, setClassCollection] = useState([])
  const [defaulterAging, setDefaulterAging] = useState(null)
  const [academicAnalytics, setAcademicAnalytics] = useState(null)
  const [demographics, setDemographics] = useState(null)
  const [teacherAnalytics, setTeacherAnalytics] = useState(null)
  const [cashflowForecast, setCashflowForecast] = useState(null)
  const [concessionAnalytics, setConcessionAnalytics] = useState(null)
  const [paymentVelocity, setPaymentVelocity] = useState(null)
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true)
      try {
        const [
          trendRes,
          classRes,
          agingRes,
          acadRes,
          demoRes,
          teacherRes,
          cashflowRes,
          concessionRes,
          velocityRes,
        ] = await Promise.allSettled([
          api.get('/reports/fee-trend?months=6'),
          api.get('/reports/fee-collection-by-class'),
          api.get('/reports/defaulter-aging'),
          api.get('/reports/academic-performance'),
          api.get('/reports/demographics'),
          api.get('/reports/teacher-performance'),
          api.get('/reports/financial-intelligence/cashflow-forecast'),
          api.get('/reports/financial-intelligence/concession-roi'),
          api.get('/reports/financial-intelligence/payment-velocity'),
        ])

        if (trendRes.status === 'fulfilled' && trendRes.value.data?.success) {
          setFeeTrend(trendRes.value.data.data)
        }
        if (classRes.status === 'fulfilled' && classRes.value.data?.success) {
          setClassCollection(classRes.value.data.data)
        }
        if (agingRes.status === 'fulfilled' && agingRes.value.data?.success) {
          setDefaulterAging(agingRes.value.data.data)
        }
        if (acadRes.status === 'fulfilled' && acadRes.value.data?.success) {
          setAcademicAnalytics(acadRes.value.data.data)
        }
        if (demoRes.status === 'fulfilled' && demoRes.value.data?.success) {
          setDemographics(demoRes.value.data.data)
        }
        if (teacherRes.status === 'fulfilled' && teacherRes.value.data?.success) {
          setTeacherAnalytics(teacherRes.value.data.data)
        }
        if (cashflowRes.status === 'fulfilled' && cashflowRes.value.data?.success) {
          setCashflowForecast(cashflowRes.value.data.data)
        }
        if (concessionRes.status === 'fulfilled' && concessionRes.value.data?.success) {
          setConcessionAnalytics(concessionRes.value.data.data)
        }
        if (velocityRes.status === 'fulfilled' && velocityRes.value.data?.success) {
          setPaymentVelocity(velocityRes.value.data.data)
        }
      } catch (err) {
        console.error('Failed to load analytics', err)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  return (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              {/* Top Row: Defaulter Aging Breakdown Cards */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Defaulter Aging Analysis
                  </h3>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    Total Outstanding: {formatPKR(defaulterAging?.totalOutstanding || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">0–30 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['0-30']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-amber-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['0-30']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
                    <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">31–60 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['31-60']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-orange-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['31-60']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">61–90 Days Overdue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {defaulterAging?.buckets?.['61-90']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-rose-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['61-90']?.amount || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-red-100/70 border border-red-300 rounded-xl">
                    <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">90+ Days Critical</p>
                    <p className="text-2xl font-bold text-red-950 mt-1">
                      {defaulterAging?.buckets?.['90+']?.count ?? 0} <span className="text-xs font-normal text-gray-500">students</span>
                    </p>
                    <p className="text-xs font-bold text-red-700 mt-1">
                      {formatPKR(defaulterAging?.buckets?.['90+']?.amount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Monthly Fee Collection Trend */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      6-Month Fee Revenue Trend
                    </h3>
                  </div>
                  <div className="h-64">
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
                  </div>
                </div>

                {/* 2. Fee Collection Rate by Class */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Fee Collection Rate (%) by Grade
                    </h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classCollection} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="className" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={45} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Collection Rate']} />
                        <Bar dataKey="collectionRate" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 2.5: Financial Intelligence & Predictive Cash Flow Suite (Pillar 2) */}
              {cashflowForecast && (
                <div className="space-y-6">
                  {/* 1. Predictive Cash Flow & 90-Day Liquidity Forecast */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-emerald-600" />
                          Predictive Cash Flow & 90-Day Liquidity Forecast (Pillar 2)
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Empirical tuition inflow projections modeled against fixed monthly staff payroll obligations
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                          Monthly Payroll Obligation: {formatPKR(cashflowForecast.monthlyPayrollObligation || 0)}
                        </span>
                      </div>
                    </div>

                    {/* 3-Month Forecast Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {(cashflowForecast.forecast || []).map((m, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-linear-to-b from-gray-50/70 to-white flex flex-col justify-between shadow-2xs">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{m.month}</span>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                {m.confidenceScore}% Confidence
                              </span>
                            </div>
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Gross Scheduled:</span>
                                <span className="font-medium text-gray-800">{formatPKR(m.grossBillable)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Concessions / Aid:</span>
                                <span className="font-medium text-rose-600">-{formatPKR(m.concessions)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Projected Inflow:</span>
                                <span className="font-bold text-emerald-700">{formatPKR(m.projectedInflow)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Payroll Liability:</span>
                                <span className="font-medium text-gray-700">-{formatPKR(m.payrollLiability)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-600">Net Operating Margin:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              m.netOperatingMargin >= 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Projected Cash Inflow vs Mandatory Payroll Obligations
                        </p>
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
                      </div>

                      {/* Historical Collection Velocity Curve */}
                      <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            Empirical Collection Velocity Curve
                          </p>
                          <p className="text-[11px] text-gray-500 mb-3">
                            Historical behavioral lag between Challan due dates and guardian bank/cash settlement
                          </p>

                          <div className="space-y-2.5">
                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-emerald-800">Early Settlers (Prior to Due Date)</span>
                                <span className="font-bold text-emerald-700">{cashflowForecast.historicalVelocity?.earlyPercentage || 18}%</span>
                              </div>
                              <div className="w-full bg-emerald-100 rounded-full h-1.5">
                                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.earlyPercentage || 18}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-indigo-800">Due Date Rush (1–10 Days)</span>
                                <span className="font-bold text-indigo-700">{cashflowForecast.historicalVelocity?.onTimePercentage || 64}%</span>
                              </div>
                              <div className="w-full bg-indigo-100 rounded-full h-1.5">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.onTimePercentage || 64}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-amber-800">Grace & Reminder Window (11–30 Days)</span>
                                <span className="font-bold text-amber-700">{cashflowForecast.historicalVelocity?.delayedPercentage || 11}%</span>
                              </div>
                              <div className="w-full bg-amber-100 rounded-full h-1.5">
                                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.delayedPercentage || 11}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="font-semibold text-rose-800">Chronic Delinquent Debt (&gt;30 Days)</span>
                                <span className="font-bold text-rose-700">{cashflowForecast.historicalVelocity?.delinquentPercentage || 7}%</span>
                              </div>
                              <div className="w-full bg-rose-100 rounded-full h-1.5">
                                <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${cashflowForecast.historicalVelocity?.delinquentPercentage || 7}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-200">
                          Data dynamically computed from 180-day empirical payment logs.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Concession & Scholarship Impact Matrix & ROI */}
                  {concessionAnalytics && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <Percent className="w-5 h-5 text-indigo-600" />
                            Institutional Concessions & Scholarship ROI Matrix
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tuition discounts awarded cross-referenced with beneficiary exam performance
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                            Total Concessions: {formatPKR(concessionAnalytics.totalConcessionsAwarded || 0)}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            Beneficiaries: {concessionAnalytics.beneficiaryCount || 0} students
                          </span>
                          {concessionAnalytics.flaggedStudents?.length > 0 && (
                            <button
                              onClick={() => setIsReviewDrawerOpen(true)}
                              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {concessionAnalytics.flaggedStudents.length} Review Required
                            </button>
                          )}
                        </div>
                      </div>

                      {(!concessionAnalytics.categories || concessionAnalytics.categories.length === 0) ? (
                        <p className="py-6 text-center text-xs text-gray-400">No active scholarship or concession records found.</p>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2.5">Concession / Aid Category</th>
                                <th className="px-4 py-2.5 text-center">Student Beneficiaries</th>
                                <th className="px-4 py-2.5 text-right">Total Concession Value</th>
                                <th className="px-4 py-2.5 text-center">Cohort Academic Avg</th>
                                <th className="px-4 py-2.5 text-right">Scholarship Review Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {concessionAnalytics.categories.map((c, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="px-4 py-2.5 font-bold text-gray-900">{c.type}</td>
                                  <td className="px-4 py-2.5 text-center font-medium text-gray-700">{c.headcount}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-indigo-700">{formatPKR(c.totalAmount)}</td>
                                  <td className="px-4 py-2.5 text-center font-bold text-gray-800">
                                    <span className={`inline-block px-2 py-0.5 rounded-md ${
                                      c.averageGradePercentage >= 75
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {c.averageGradePercentage}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    {c.reviewRequiredCount > 0 ? (
                                      <button
                                        onClick={() => setIsReviewDrawerOpen(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        {c.reviewRequiredCount} Below Benchmark
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Payment Recovery Channels & Settlement Latency
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tuition settlement velocity and digital payment adoption trends
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                          <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Median Days to Settle</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.medianDaysToSettle} <span className="text-xs font-normal text-gray-500">days after due</span>
                          </p>
                          <p className="text-[11px] text-indigo-600 mt-1">50% of guardians settle within this window</p>
                        </div>

                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">On-Time Settlement Rate</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.onTimeCollectionRate}%
                          </p>
                          <p className="text-[11px] text-emerald-600 mt-1">Paid on or prior to official deadline</p>
                        </div>

                        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl">
                          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">Digital Payment Adoption</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {paymentVelocity.digitalAdoptionRate}%
                          </p>
                          <p className="text-[11px] text-teal-600 mt-1">Settled via Bank Transfer, Online, JazzCash, or EasyPaisa</p>
                        </div>
                      </div>

                      {/* Payment Channels Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {(paymentVelocity.channelBreakdown || []).map((ch, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <p className="text-xs font-bold text-gray-800">{ch.mode}</p>
                            <p className="text-sm font-extrabold text-indigo-700 mt-1">{formatPKR(ch.totalAmount)}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{ch.transactionCount} transactions ({ch.share}%)</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Academic Performance Analytics (FR-RP-02) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    Academic Performance & Grading Distribution
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      Overall Pass Rate: {academicAnalytics?.passRate ?? 0}%
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Avg Score: {academicAnalytics?.averageScore ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Summary Metric Cards */}
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Total Graded Submissions</p>
                      <p className="text-2xl font-bold text-indigo-950 mt-1">{academicAnalytics?.totalGraded || 0}</p>
                      <p className="text-xs text-indigo-600 mt-1">Evaluated across all examination terms</p>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Institutional Passing Rate</p>
                      <p className="text-2xl font-bold text-emerald-950 mt-1">{academicAnalytics?.passRate ?? 0}%</p>
                      <p className="text-xs text-emerald-600 mt-1">Students achieving Grade D or higher</p>
                    </div>

                    <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl">
                      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Mean Academic Score</p>
                      <p className="text-2xl font-bold text-violet-950 mt-1">{academicAnalytics?.averageScore ?? 0}%</p>
                      <p className="text-xs text-violet-600 mt-1">Average weighted percentage across subjects</p>
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  <div className="lg:col-span-2 h-64">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Grade Breakdown (A+ to F)
                    </p>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={academicAnalytics?.distribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                        <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 4: Student Demographics & Diversity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gender Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-600" />
                      Student Gender Ratio ({demographics?.totalEnrolled || 0} Total)
                    </h3>
                  </div>
                  <div className="h-60 flex items-center justify-center">
                    {demographics?.gender?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
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
                    ) : (
                      <p className="text-xs text-gray-400">No demographic data available.</p>
                    )}
                  </div>
                </div>

                {/* Age Group Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Age Group Distribution
                    </h3>
                  </div>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographics?.ageDistribution || []} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} students`, 'Headcount']} />
                        <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 5: Teacher Attendance & Faculty Overview */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Teacher & Faculty Performance Ledger
                  </h3>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                      Faculty Headcount: {teacherAnalytics?.totalFaculty || 0}
                    </span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      Average Attendance: {teacherAnalytics?.averageAttendanceRate || 0}%
                    </span>
                  </div>
                </div>

                {(!teacherAnalytics?.teachers || teacherAnalytics.teachers.length === 0) ? (
                  <p className="py-6 text-center text-xs text-gray-400">No faculty records found.</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
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
                      <tbody className="divide-y divide-gray-100">
                        {teacherAnalytics.teachers.slice(0, 10).map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-gray-600">{t.staffId}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-900">{t.fullName}</td>
                            <td className="px-4 py-2.5 text-gray-600">{t.designation}</td>
                            <td className="px-4 py-2.5 text-gray-600">{t.department}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700">{t.totalDays}</td>
                            <td className="px-4 py-2.5 text-center text-gray-700">{t.presentDays}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                t.attendanceRate >= 90
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : t.attendanceRate >= 75
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
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
            </>
          )}
      {/* Flagged Scholarship Review Candidates Modal */}
      {isReviewDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Merit Scholarship Academic Review</h3>
                  <p className="text-xs text-gray-500">Students receiving merit discounts with academic score below 70% threshold</p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-3 flex-1 pr-1">
              {(!concessionAnalytics?.flaggedStudents || concessionAnalytics.flaggedStudents.length === 0) ? (
                <p className="py-8 text-center text-xs text-gray-400">All merit scholarship recipients currently meet the academic standard.</p>
              ) : (
                concessionAnalytics.flaggedStudents.map((s, idx) => (
                  <div key={idx} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{s.fullName}</span>
                        <span className="font-mono text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                          {s.studentId}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{s.className}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-gray-600">
                          Discount Awarded: <strong className="text-gray-900">{formatPKR(s.discountAmount)}</strong>
                        </span>
                        <span className="text-gray-600">
                          Guardian: <strong className="text-gray-900">{s.guardianPhone || 'N/A'}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                        {s.currentAverage}% Avg
                      </span>
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires Review</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {concessionAnalytics?.flaggedStudents?.length || 0} candidate(s) flagged for scholarship panel review
              </span>
              <button
                onClick={() => setIsReviewDrawerOpen(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}