import { useState } from 'react'
import { Download } from 'lucide-react'
import api from '../../../lib/axios'
import { logError } from '../../../lib/logger'

export function useChallanActions({ toast, fetchData, students, studentFees, selectedGrade, selectedSection, setDownloadingChallanId, setShowGenerateModal, setGeneratingChallans, generationTargetDate, forceRegenerate }) {
  const handleDownloadChallan = async (feeRecord) => {
    setDownloadingChallanId(feeRecord._id)
    try {
      const res = await api.get(`/finance/challan/${feeRecord._id}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const studentCode = feeRecord.studentId?.studentId || 'STU'
      const challanSuffix = feeRecord._id.slice(-6).toUpperCase()
      link.setAttribute('download', `Fee_Challan_${studentCode}_${challanSuffix}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Refresh data so Due Date column reflects the new 10-day post-download due date immediately
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to download Fee Challan PDF')
    } finally {
      setDownloadingChallanId(null)
    }
  }

  // Bulk Print / Download Section Challans
  const [bulkPrinting, setBulkPrinting] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null)

  const handleBulkPrintChallans = async () => {
    if (!activeFeeLedger || activeFeeLedger.length === 0) {
      toast.warning('No students found in this section to generate challans.')
      return
    }

    setBulkPrinting(true)
    let count = 0
    try {
      for (const feeRecord of activeFeeLedger) {
        setBulkProgress(`Downloading ${count + 1} of ${activeFeeLedger.length}...`)
        const res = await api.get(`/finance/challan/${feeRecord._id}`, {
          responseType: 'blob',
        })
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const studentCode = feeRecord.studentId?.studentId || 'STU'
        const challanSuffix = feeRecord._id.slice(-6).toUpperCase()
        link.setAttribute('download', `Fee_Challan_${studentCode}_${challanSuffix}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.parentNode.removeChild(link)
        window.URL.revokeObjectURL(url)
        count++
        await new Promise((r) => setTimeout(r, 150))
      }

      // Refresh data after bulk downloads
      await fetchData()
      toast.success(`Successfully downloaded ${count} fee challans!`)
    } catch (err) {
      logError('Bulk challan error', err)
      toast.error('Failed while downloading bulk challans')
    } finally {
      setBulkPrinting(false)
      setBulkProgress(null)
    }
  }

  const handleTriggerMonthlyGeneration = async (e) => {
    e.preventDefault()
    setGeneratingChallans(true)
    try {
      const res = await api.post('/finance/monthly-challans/generate', {
        targetDate: generationTargetDate,
        force: forceRegenerate,
      })
      if (res.data?.success) {
        setShowGenerateModal(false)
        await fetchData()
        toast.success(
          `Monthly challans generated for ${res.data.data.month} ${res.data.data.year}: ${res.data.data.generatedCount} generated, ${res.data.data.skippedCount} skipped.`
        )
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Failed to generate monthly challans'
      )
    } finally {
      setGeneratingChallans(false)
    }
  }

  const activeFeeLedger = studentFees.filter((f) => {
    if (!selectedGrade || !selectedSection || !f.studentId) return false
    const matchesClass =
      f.studentId.classId &&
      (f.studentId.classId === selectedGrade._id ||
        f.studentId.classId._id === selectedGrade._id ||
        f.studentId.classId?.name === selectedGrade.name)
    const matchesSection = f.studentId.sectionId === selectedSection
    return matchesClass && matchesSection
  })

  return { handleDownloadChallan, handleBulkPrintChallans, handleTriggerMonthlyGeneration, activeFeeLedger, bulkPrinting, bulkProgress }
}
