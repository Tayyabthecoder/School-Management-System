import React from 'react'
import { Plus } from 'lucide-react'
import { formatDate } from '../../../lib/formatters'

/** Attendance tab of the guardian portal. */
export default function GuardianAttendanceTab({
  attSummary,
  attHistory,
  isLowAttendance,
  attendance,
  leaveRequests,
  setShowLeaveModal,
}) {
  return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Attendance & Absence Management</h3>
                <p className="text-xs text-gray-500 mt-0.5">Track daily attendance and submit digital leave applications</p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Apply for Student Leave
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Sessions</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{attSummary.totalDays || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Present Days</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{attSummary.presentDays || 0}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
                <span className="text-xs text-gray-500 font-semibold uppercase">Attendance Rate</span>
                <div className={`text-2xl font-black mt-1 ${isLowAttendance ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {attSummary.attendancePercentage || '100%'}
                </div>
              </div>
            </div>

            {/* Leave Requests Status List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Submitted Leave Applications</h4>
              {leaveRequests.length === 0 ? (
                <p className="text-xs text-gray-500">No leave requests submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaveRequests.map((leave) => {
                    let statusBg = 'bg-amber-100 text-amber-800'
                    if (leave.status === 'Approved') statusBg = 'bg-green-100 text-green-800'
                    if (leave.status === 'Rejected') statusBg = 'bg-red-100 text-red-800'

                    return (
                      <div key={leave._id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{leave.category} Leave</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · Reason: <em>"{leave.reason}"</em>
                          </p>
                        </div>

                        {leave.reviewRemarks && (
                          <span className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                            Note: {leave.reviewRemarks}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Daily Records List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-700">
                Daily Attendance Timeline
              </div>
              {attHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">No attendance recorded yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {attHistory.map((rec, i) => {
                    let statusBg = 'bg-emerald-100 text-emerald-800'
                    if (rec.status === 'Absent') statusBg = 'bg-red-100 text-red-800'
                    if (rec.status === 'Late') statusBg = 'bg-amber-100 text-amber-800'
                    if (rec.status === 'Excused') statusBg = 'bg-blue-100 text-blue-800'

                    return (
                      <div key={rec.date ? String(rec.date) : i} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50">
                        <div>
                          <span className="font-bold text-gray-800">{formatDate(rec.date)}</span>
                          {rec.remarks && <p className="text-[11px] text-gray-500 mt-0.5">{rec.remarks}</p>}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusBg}`}>
                          {rec.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
  )
}
