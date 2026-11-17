import React from 'react'
import { Check, XCircle } from 'lucide-react'
import { formatDate } from '../../../lib/formatters'

/** Student leave requests tab. */
export default function LeaveRequestsTab({
  handleReviewLeave,
  leaveRequests,
  leavesLoading,
  leaveFilter,
  setLeaveFilter,
  reviewingId,
}) {
  return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Parent Leave Applications</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Review and approve digital absence requests submitted by guardians</p>
              </div>

              <select aria-label="Filter leave requests"
                value={leaveFilter}
                onChange={(e) => setLeaveFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                <option value="ALL">All Applications</option>
                <option value="Pending">Pending Only</option>
                <option value="Approved">Approved Only</option>
                <option value="Rejected">Rejected Only</option>
              </select>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {leavesLoading ? (
                <div className="p-8 text-center text-xs text-gray-500 dark:text-slate-400">Loading leave requests…</div>
              ) : leaveRequests.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-500 dark:text-slate-400">
                  No student leave requests matching your filter.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {leaveRequests.map((leave) => {
                    let statusBg = 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                    if (leave.status === 'Approved') statusBg = 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                    if (leave.status === 'Rejected') statusBg = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'

                    return (
                      <div key={leave._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">{leave.studentId?.fullName}</span>
                            <span className="text-[10px] text-gray-500 dark:text-slate-400">({leave.classId?.name} - {leave.sectionId})</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusBg}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-slate-400">
                            <strong>{leave.category} Leave:</strong> {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                          </p>
                          <p className="text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800 italic">
                            "{leave.reason}"
                          </p>
                        </div>

                        {leave.status === 'Pending' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={reviewingId === leave._id}
                              onClick={() => handleReviewLeave(leave._id, 'Approved')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === leave._id}
                              onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-800">
                            Reviewed
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
  )
}
