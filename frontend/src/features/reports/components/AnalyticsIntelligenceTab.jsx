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
import { logError } from '../../../lib/logger'
import { cachedGet } from '../../../lib/cachedGet'
import ChartFrame from '../../../components/ui/ChartFrame'
import AnalyticsReviewDrawer from './AnalyticsReviewDrawer'
import DemographicsRow from './AnalyticsDemographicsRow'
import AnalyticsTeacherLedger from './AnalyticsTeacherLedger'
import AnalyticsAcademicPerformance from './AnalyticsAcademicPerformance'
import AnalyticsFinancialIntelligence from './AnalyticsFinancialIntelligence'
import AnalyticsChartsRow from './AnalyticsChartsRow'
import AnalyticsDefaulterAging from './AnalyticsDefaulterAging'
import { useAnalyticsData } from './hooks/useAnalyticsData'


export default function AnalyticsIntelligenceTab() {
  const { analyticsLoading, feeTrend, classCollection, defaulterAging, academicAnalytics, demographics, teacherAnalytics, cashflowForecast, concessionAnalytics, paymentVelocity, isReviewDrawerOpen, setIsReviewDrawerOpen } = useAnalyticsData()

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
              <AnalyticsDefaulterAging
                defaulterAging={defaulterAging}
              />

              {/* Middle Row: Charts */}
              <AnalyticsChartsRow
                feeTrend={feeTrend}
                classCollection={classCollection}
              />

              {/* Row 2.5: Financial Intelligence & Predictive Cash Flow Suite (Pillar 2) */}
              {cashflowForecast && (
                <AnalyticsFinancialIntelligence
                  cashflowForecast={cashflowForecast}
                  concessionAnalytics={concessionAnalytics}
                  paymentVelocity={paymentVelocity}
                  setIsReviewDrawerOpen={setIsReviewDrawerOpen}
                />
              )}

              {/* Row 3: Academic Performance Analytics (FR-RP-02) */}
              <AnalyticsAcademicPerformance
                academicAnalytics={academicAnalytics}
              />

              {/* Row 4: Student Demographics & Diversity */}
              <DemographicsRow
                demographics={demographics}
              />

              {/* Row 5: Teacher Attendance & Faculty Overview */}
              <AnalyticsTeacherLedger
                teacherAnalytics={teacherAnalytics}
              />
            </>
          )}
      {/* Flagged Scholarship Review Candidates Modal */}
      {isReviewDrawerOpen && (
        <AnalyticsReviewDrawer
          concessionAnalytics={concessionAnalytics}
          setIsReviewDrawerOpen={setIsReviewDrawerOpen}
        />
      )}
    </div>
  )
}