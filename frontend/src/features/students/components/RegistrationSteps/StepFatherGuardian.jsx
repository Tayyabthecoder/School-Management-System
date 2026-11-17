import React from 'react'
import { Shield, Phone, Mail, MapPin, CreditCard, Briefcase, AlertCircle, Copy, CheckCircle2 } from 'lucide-react'

export default function StepFatherGuardian({
  newStudent,
  setNewStudent,
  formErrors,
  clearFieldError,
  copyFatherToGuardian,
}) {
  return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">Father & Guardian Profile</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">Father record always archived</span>
                  </div>

                  {/* Father's Full Name & Status Toggle Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        Father's Full Name <span className="text-red-500">*</span>
                      </label>
                      <input aria-label="Father's Full Name"
                        type="text"
                        value={newStudent.fatherName}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, fatherName: e.target.value })
                          clearFieldError('fatherName')
                        }}
                        placeholder="e.g. Tariq Mehmood"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.fatherName
                            ? 'border-red-500 bg-red-50/30 dark:bg-red-950/40 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.fatherName && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.fatherName}
                        </p>
                      )}
                    </div>

                    {/* Status Pill Checkbox/Radio */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                        Father's Status <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({ ...prev, fatherStatus: 'Alive' }))
                            clearFieldError('fatherPhone')
                          }}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            newStudent.fatherStatus === 'Alive'
                              ? 'bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-200'
                              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Alive (Primary Contact)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStudent(prev => ({ ...prev, fatherStatus: 'Deceased' }))
                            clearFieldError('guardianName')
                            clearFieldError('guardianPhone')
                          }}
                          className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            newStudent.fatherStatus === 'Deceased'
                              ? 'bg-amber-700 text-white border-amber-600 shadow-md shadow-amber-200'
                              : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Deceased (Require Guardian)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── PANEL A: FATHER ALIVE DETAILS ──────────────────────── */}
                  {newStudent.fatherStatus === 'Alive' && (
                    <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold pb-2 border-b border-emerald-100 dark:border-emerald-900">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Father Contact & Professional Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Father Contact Phone <span className="text-red-500">*</span>
                          </label>
                          <input aria-label="Father Contact Phone"
                            type="tel"
                            value={newStudent.fatherPhone}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, fatherPhone: e.target.value })
                              clearFieldError('fatherPhone')
                            }}
                            placeholder="+92 300 1234567"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white dark:bg-slate-900 transition-all ${
                              formErrors.fatherPhone
                                ? 'border-red-500 bg-red-50/30 dark:bg-red-950/40 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 dark:border-slate-600 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.fatherPhone && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.fatherPhone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Father Email Address
                          </label>
                          <input aria-label="Father Email Address"
                            type="email"
                            value={newStudent.fatherEmail}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherEmail: e.target.value })}
                            placeholder="father@gmail.com"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Father CNIC Number
                          </label>
                          <input aria-label="Father CNIC Number"
                            type="text"
                            value={newStudent.fatherCnic}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherCnic: e.target.value })}
                            placeholder="42101-7654321-1"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Father Occupation / Business
                          </label>
                          <input aria-label="Father Occupation / Business"
                            type="text"
                            value={newStudent.fatherOccupation}
                            onChange={(e) => setNewStudent({ ...newStudent, fatherOccupation: e.target.value })}
                            placeholder="e.g. Software Engineer, Business"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── PANEL B: FATHER DECEASED → GUARDIAN DETAILS ─────────── */}
                  {newStudent.fatherStatus === 'Deceased' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 text-xs font-bold">
                          <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Appointed Guardian Details (Active Contact)</span>
                        </div>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          Father: {newStudent.fatherName || 'Recorded'} (Deceased)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Guardian Full Name <span className="text-red-500">*</span>
                          </label>
                          <input aria-label="Guardian Full Name"
                            type="text"
                            value={newStudent.guardianName}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianName: e.target.value })
                              clearFieldError('guardianName')
                            }}
                            placeholder="e.g. Fatima Tariq"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white dark:bg-slate-900 transition-all ${
                              formErrors.guardianName
                                ? 'border-red-500 bg-red-50/30 dark:bg-red-950/40 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 dark:border-slate-600 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.guardianName && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.guardianName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Relationship to Student <span className="text-red-500">*</span>
                          </label>
                          <select aria-label="Relationship to Student"
                            value={newStudent.guardianRelationship}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianRelationship: e.target.value })
                              clearFieldError('guardianRelationship')
                            }}
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900"
                          >
                            <option value="Mother">Mother</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Uncle">Uncle</option>
                            <option value="Aunt">Aunt</option>
                            <option value="Grandfather">Grandfather</option>
                            <option value="Grandmother">Grandmother</option>
                            <option value="Legal Guardian">Legal Guardian</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Guardian Contact Phone <span className="text-red-500">*</span>
                          </label>
                          <input aria-label="Guardian Contact Phone"
                            type="tel"
                            value={newStudent.guardianPhone}
                            onChange={(e) => {
                              setNewStudent({ ...newStudent, guardianPhone: e.target.value })
                              clearFieldError('guardianPhone')
                            }}
                            placeholder="+92 300 7654321"
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none bg-white dark:bg-slate-900 transition-all ${
                              formErrors.guardianPhone
                                ? 'border-red-500 bg-red-50/30 dark:bg-red-950/40 focus:ring-2 focus:ring-red-400'
                                : 'border-gray-300 dark:border-slate-600 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                            }`}
                          />
                          {formErrors.guardianPhone && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.guardianPhone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Guardian Email
                          </label>
                          <input aria-label="Guardian Email"
                            type="email"
                            value={newStudent.guardianEmail}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianEmail: e.target.value })}
                            placeholder="guardian@gmail.com"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Guardian CNIC Number
                          </label>
                          <input aria-label="Guardian CNIC Number"
                            type="text"
                            value={newStudent.guardianCnic}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianCnic: e.target.value })}
                            placeholder="42101-9876543-2"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                            Guardian Occupation
                          </label>
                          <input aria-label="Guardian Occupation"
                            type="text"
                            value={newStudent.guardianOccupation}
                            onChange={(e) => setNewStudent({ ...newStudent, guardianOccupation: e.target.value })}
                            placeholder="e.g. Teacher, Doctor, Business"
                            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
  )
}
