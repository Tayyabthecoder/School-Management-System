import React from 'react'
import { HeartPulse, Activity, PhoneCall, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatPKR } from '../../../../lib/formatters'
import Badge from '../../../../components/ui/Badge'

export default function StepHealthEmergency({
  newStudent,
  setNewStudent,
  _formErrors,
  currentModalClass,
  netPayableTotal,
}) {
  return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <HeartPulse className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Health, Medical & Emergency Contact</h3>
                  </div>

                  {/* Blood Group Selection Pills */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Blood Group
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setNewStudent({ ...newStudent, bloodGroup: bg })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            newStudent.bloodGroup === bg
                              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-200 scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-700'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medical Notes / Allergies */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Medical Notes, Dietary Allergies, or Special Care
                    </label>
                    <textarea
                      rows={2}
                      value={newStudent.medicalNotes}
                      onChange={(e) => setNewStudent({ ...newStudent, medicalNotes: e.target.value })}
                      placeholder="None reported / General fitness"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    />
                  </div>

                  {/* Secondary Emergency Contact Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Alternative Emergency Contact (Optional)
                      </span>
                      <span className="text-[10px] text-gray-400">Defaults to primary guardian if left blank</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={newStudent.emergencyName}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyName: e.target.value })}
                          placeholder="e.g. Uncle Farhan"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          value={newStudent.emergencyPhone}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyPhone: e.target.value })}
                          placeholder="+92 300 0000000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={newStudent.emergencyRelationship}
                          onChange={(e) => setNewStudent({ ...newStudent, emergencyRelationship: e.target.value })}
                          placeholder="Guardian / Uncle"
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Review Box */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
                    <div>
                      <p className="font-bold">Ready to Register:</p>
                      <p className="text-indigo-700">
                        {newStudent.fullName || 'Student'} · {currentModalClass?.name} ({newStudent.sectionId}) · Net Fee: <strong>{formatPKR(netPayableTotal)}</strong> ({newStudent.feeSetup?.initialPaymentStatus === 'Paid' ? 'Paid Upfront' : 'Pending Challan'})
                      </p>
                    </div>
                    <Badge variant="indigo">Step 5 of 5</Badge>
                  </div>
                </div>
  )
}
