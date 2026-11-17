import { useState, useEffect } from 'react'
import { logError } from '../../../../lib/logger'
import { cachedGet } from '../../../../lib/cachedGet'

export function useAnalyticsData() {
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
          cachedGet('/reports/fee-trend?months=6'),
          cachedGet('/reports/fee-collection-by-class'),
          cachedGet('/reports/defaulter-aging'),
          cachedGet('/reports/academic-performance'),
          cachedGet('/reports/demographics'),
          cachedGet('/reports/teacher-performance'),
          cachedGet('/reports/financial-intelligence/cashflow-forecast'),
          cachedGet('/reports/financial-intelligence/concession-roi'),
          cachedGet('/reports/financial-intelligence/payment-velocity'),
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
        logError('Failed to load analytics', err)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  return { analyticsLoading, feeTrend, classCollection, defaulterAging, academicAnalytics, demographics, teacherAnalytics, cashflowForecast, concessionAnalytics, paymentVelocity, isReviewDrawerOpen, setIsReviewDrawerOpen }
}
