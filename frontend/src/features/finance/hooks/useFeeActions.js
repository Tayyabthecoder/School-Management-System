import api from '../../../lib/axios'
import { formatPKR } from '../../../lib/formatters'

export function useFeeActions({ toast, fetchData, setShowPaymentModal, selectedFeeRecord, setSelectedFeeRecord, paymentAmount, setPaymentAmount, paymentMode, setSubmittingPayment, setShowConcessionModal, concessionFeeRecord, setConcessionFeeRecord, concessionType, setConcessionType, discountAmount, setDiscountAmount, concessionReason, setConcessionReason, setSubmittingConcession }) {
  const handleOpenPayment = (feeRecord) => {
    setSelectedFeeRecord(feeRecord)
    setPaymentAmount(feeRecord.outstandingAmount || feeRecord.netAmount)
    setShowPaymentModal(true)
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!selectedFeeRecord) return
    setSubmittingPayment(true)

    try {
      const res = await api.post('/finance/payments', {
        studentFeeId: selectedFeeRecord._id,
        amountPaid: Number(paymentAmount),
        paymentMode,
      })

      if (res.data?.success) {
        setShowPaymentModal(false)
        fetchData()
        toast.success(`Payment recorded successfully! Receipt #: ${res.data.data.payment.receiptNo}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Payment recording failed')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Concession Modal Triggers
  const handleOpenConcessionModal = (feeRecord) => {
    setConcessionFeeRecord(feeRecord)
    setConcessionType(
      feeRecord.concessionType && feeRecord.concessionType !== 'None'
        ? feeRecord.concessionType
        : 'Sibling Discount'
    )
    setDiscountAmount(feeRecord.discount || 0)
    setConcessionReason(feeRecord.concessionReason || '')
    setShowConcessionModal(true)
  }

  const handleApplyPresetPercentage = (pct) => {
    if (!concessionFeeRecord) return
    const calculated = Math.round((concessionFeeRecord.amountDue * pct) / 100)
    setDiscountAmount(calculated)
  }

  const handleApplyConcession = async (e) => {
    e.preventDefault()
    if (!concessionFeeRecord) return
    setSubmittingConcession(true)

    try {
      const res = await api.post('/finance/concession', {
        studentFeeId: concessionFeeRecord._id,
        discountAmount: Number(discountAmount),
        concessionType,
        concessionReason,
      })

      if (res.data?.success) {
        setShowConcessionModal(false)
        await fetchData()
        toast.success(`Fee concession applied successfully! New net amount: PKR ${formatPKR(res.data.data.netAmount)}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to apply fee concession')
    } finally {
      setSubmittingConcession(false)
    }
  }


  return { handleOpenPayment, handleRecordPayment, handleOpenConcessionModal, handleApplyPresetPercentage, handleApplyConcession }
}
