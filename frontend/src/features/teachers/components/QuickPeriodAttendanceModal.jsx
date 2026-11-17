import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { SkeletonTable } from '../../../components/ui/Skeleton'
import api from '../../../lib/axios'
import { toLocalDateInput } from '../../../lib/formatters'
import { useToast } from '../../../store/toastStore'
import { cachedGet } from '../../../lib/cachedGet'

// ─── Fast Period Attendance Modal ─────────────────────────────────────────────
export default function QuickPeriodAttendanceModal({ open, period, onClose, onAttendanceMarked }) {
  const toast = useToast()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState({}) // { studentId: 'Present' | 'Absent' | 'Late' | 'Excused' }

  useEffect(() => {
    if (!open || !period?.class?._id) return

    const loadRoster = async () => {
      setLoading(true)
      try {
        const res = await cachedGet('/students', {
          params: {
            classId: period.class._id,
            sectionId: period.sectionId,
            limit: 100,
          },
        })
        const studentList = res.data?.data || []
        setStudents(studentList)

        // Initialize all to Present by default
        const initRecs = {}
        studentList.forEach(s => {
          initRecs[s._id] = 'Present'
        })
        setRecords(initRecs)
      } catch (err) {
        toast.error('Failed to load class student roster')
      } finally {
        setLoading(false)
      }
    }

    loadRoster()
  }, [open, period, toast])

  const setAllStatus = (status) => {
    const updated = {}
    students.forEach(s => {
      updated[s._id] = status
    })
    setRecords(updated)
  }

  const toggleStudentStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        classId: period.class._id,
        sectionId: period.sectionId,
        date: toLocalDateInput(),
        periodNumber: period.periodNumber || 1,
        records: students.map(s => ({
          studentId: s._id,
          status: records[s._id] || 'Present',
        })),
      }

      const res = await api.post('/attendance/student', payload)
      if (res.data?.success) {
        toast.success(`Attendance recorded for ${period.class.name} (${period.sectionId}) — Period ${period.periodNumber}!`)
        onAttendanceMarked()
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !period) return null

  const presentCount = Object.values(records).filter(s => s === 'Present').length
  const absentCount = Object.values(records).filter(s => s === 'Absent').length
  const lateCount = Object.values(records).filter(s => s === 'Late').length

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold text-xs rounded-full uppercase">
                Period {period.periodNumber}
              </span>
              <span className="text-xs text-indigo-200">
                {period.startTime} – {period.endTime}
              </span>
            </div>
            <h3 className="text-lg font-bold mt-1">
              Take Attendance: {period.class?.name} ({period.sectionId})
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Subject: {period.subject?.name} · Room: {period.room || 'Classroom'}
            </p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-lg">✕</button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAllStatus('Present')}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-bold"
            >
              ✓ All Present
            </button>
            <button
              type="button"
              onClick={() => setAllStatus('Absent')}
              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-bold"
            >
              ✕ All Absent
            </button>
          </div>

          <div className="flex gap-3 text-gray-600 font-semibold">
            <span className="text-green-700">Present: {presentCount}</span>
            <span className="text-red-600">Absent: {absentCount}</span>
            <span className="text-amber-700">Late: {lateCount}</span>
          </div>
        </div>

        {/* Student Roster List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <SkeletonTable rows={5} />
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No students enrolled in this class and section.
            </div>
          ) : (
            students.map((student, idx) => {
              const curStatus = records[student._id] || 'Present'
              return (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs truncate">{student.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">ID: {student.studentId} · Roll: {student.rollNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-1.5">
                    {['Present', 'Absent', 'Late', 'Excused'].map((st) => {
                      const isActive = curStatus === st
                      let btnColor = 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      if (isActive) {
                        if (st === 'Present') btnColor = 'bg-green-600 text-white font-bold shadow-sm'
                        if (st === 'Absent') btnColor = 'bg-red-600 text-white font-bold shadow-sm'
                        if (st === 'Late') btnColor = 'bg-amber-700 text-white font-bold shadow-sm'
                        if (st === 'Excused') btnColor = 'bg-blue-600 text-white font-bold shadow-sm'
                      }

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStudentStatus(student._id, st)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${btnColor}`}
                        >
                          {st}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Saving Attendance…' : `Save Period Attendance (${students.length} Students)`}
          </button>
        </div>
      </div>
    </div>
  )
}
