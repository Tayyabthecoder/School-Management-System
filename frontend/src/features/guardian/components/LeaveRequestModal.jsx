import React from 'react'
import { Send } from 'lucide-react'

/** Dialog to request leave for a child. */
export default function LeaveRequestModal({
  handleSubmitLeave,
  child,
  setShowLeaveModal,
  leaveForm,
  setLeaveForm,
  submittingLeave,
}) {
  return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-slate-800">
              <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base">Apply for Student Leave</h3>
                  <p className="text-xs text-indigo-300 mt-0.5">Submit an absence note to {child?.fullName}'s teacher</p>
                </div>
                <button onClick={() => setShowLeaveModal(false)} className="text-indigo-200 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSubmitLeave} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Start Date *</label>
                    <input aria-label="Start Date"
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">End Date *</label>
                    <input aria-label="End Date"
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Leave Category</label>
                  <select aria-label="Leave Category"
                    value={leaveForm.category}
                    onChange={(e) => setLeaveForm({ ...leaveForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl"
                  >
                    <option value="Sick">Sick / Illness</option>
                    <option value="Medical">Medical Appointment / Hospital</option>
                    <option value="Family">Family Event / Emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Reason / Note *</label>
                  <textarea aria-label="Reason / Note"
                    rows={3}
                    required
                    placeholder="e.g. Suffering from viral fever, doctor advised 2 days bed rest…"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLeave}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingLeave ? 'Submitting…' : 'Submit Leave'}
                  </button>
                </div>
              </form>
            </div>
          </div>
  )
}
