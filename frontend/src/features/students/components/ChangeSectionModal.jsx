import React, { useState, useEffect } from 'react'
import { ArrowRightLeft, X, AlertCircle } from 'lucide-react'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

export default function ChangeSectionModal({
  open,
  student,
  currentClass,
  classes = [],
  onClose,
  onSuccess,
}) {
  const toast = useToastStore()
  const [selectedSection, setSelectedSection] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Determine the student's class object
  const classObj =
    currentClass ||
    (student?.classId && typeof student.classId === 'object' && Array.isArray(student.classId.sections)
      ? student.classId
      : classes.find(
          (c) =>
            String(c._id) === String(student?.classId?._id || student?.classId) ||
            c.name === (student?.classId?.name || student?.classId)
        ))

  const currentSection = (student?.sectionId || '').toUpperCase()
  const availableSections = (classObj?.sections || ['A', 'B']).map((s) => s.toUpperCase())
  const otherSections = availableSections.filter((s) => s !== currentSection)

  useEffect(() => {
    if (open) {
      if (otherSections.length > 0) {
        setSelectedSection(otherSections[0])
      } else {
        setSelectedSection('')
      }
      setReason('')
    }
  }, [open, student, classObj])

  if (!open || !student) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSection) {
      toast.error('Please select a target section')
      return
    }
    if (selectedSection === currentSection) {
      toast.error(`Student is already enrolled in Section ${currentSection}`)
      return
    }

    setLoading(true)
    try {
      const res = await api.patch(`/students/${student._id}/section`, {
        sectionId: selectedSection,
        reason: reason.trim(),
      })

      if (res.data?.success) {
        toast.success(
          `Section changed from ${currentSection} to ${selectedSection} for ${student.fullName}!`
        )
        if (onSuccess) {
          onSuccess(res.data.data)
        }
        onClose()
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to change student section'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Change Student Section</h2>
              <p className="text-xs text-indigo-200">Reassign section within {classObj?.name || 'Class'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Student Info Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Student</p>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {student.fullName}
                </h4>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {student.studentId || 'N/A'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Class: <strong>{classObj?.name || 'Assigned Class'}</strong></span>
              <span className="text-slate-500 dark:text-slate-400">
                Current Section: <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">Section {currentSection}</span>
              </span>
            </div>
          </div>

          {/* Section Selection */}
          {otherSections.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-0.5">No Alternate Sections Available</p>
                <p>
                  Class "{classObj?.name || 'Class'}" currently only has section{' '}
                  <strong>{currentSection}</strong> configured. To move this student, please create another section first in Academics.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Select New Section in {classObj?.name} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableSections.map((sec) => {
                  const isCurrent = sec === currentSection
                  const isSelected = sec === selectedSection

                  return (
                    <button
                      key={sec}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelectedSection(sec)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-600/30'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span className="text-base font-extrabold">{sec}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {isCurrent ? 'Current' : isSelected ? 'Selected' : 'Section'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Reason / Administrative Notes (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Parental transfer request, class balance"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otherSections.length === 0 || !selectedSection || selectedSection === currentSection}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {loading ? 'Changing…' : 'Change Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
