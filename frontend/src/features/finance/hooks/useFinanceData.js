import { useEffect } from 'react'
import { loadClasses } from '../../../hooks/useClasses'
import { FALLBACK_GRADES } from '../../../constants/grades'
import { cachedGet } from '../../../lib/cachedGet'

export function useFinanceData({ setClasses, students, setStudents, setStudentFees, setLoading, setOverdueStats, setCronStatus }) {
  const fetchData = async () => {
    setLoading(true)
    try {
      const [clsRes, stuRes, feesRes, statsRes, cronRes] = await Promise.all([
        loadClasses(),
        cachedGet('/students', { params: { limit: 1000 } }),
        cachedGet('/finance/student-fees', { params: { limit: 1000 } }),
        cachedGet('/reports/dashboard-stats').catch(() => ({ data: { data: {} } })),
        cachedGet('/finance/monthly-challans/status').catch(() => ({ data: { data: null } })),
      ])
      if (clsRes.data?.success && clsRes.data.data.length > 0) {
        setClasses(clsRes.data.data)
      } else {
        setClasses(FALLBACK_GRADES)
      }
      if (stuRes.data?.success) setStudents(stuRes.data.data)
      if (feesRes.data?.success) setStudentFees(feesRes.data.data)
      if (statsRes.data?.success) {
        setOverdueStats({
          count: statsRes.data.data?.overdueCount || 0,
          total: statsRes.data.data?.overdueTotal || 0,
        })
      }
      if (cronRes.data?.success) {
        setCronStatus(cronRes.data.data)
      }
    } catch (err) {
      setClasses(FALLBACK_GRADES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { fetchData }
}
