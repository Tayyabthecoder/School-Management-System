import React from 'react'
import { BookOpen, GraduationCap, Bus, Calendar, AlertCircle } from 'lucide-react'

export default function StepAcademics({
  newStudent,
  setNewStudent,
  formErrors,
  displayClasses,
  modalClassSections,
  fetchFeeStructuresForClass,
}) {
  return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Academic Placement & History</h3>
                  </div>

                  {/* Class Selection & Section Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Academic Class / Grade <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newStudent.classId}
                        onChange={(e) => {
                          const targetCls = displayClasses.find(c => String(c._id) === String(e.target.value))
                          const selectedClassId = e.target.value
                          setNewStudent({
                            ...newStudent,
                            classId: selectedClassId,
                            sectionId: targetCls?.sections?.[0] || 'A',
                          })
                          clearFieldError('classId')
                          fetchFeeStructuresForClass(selectedClassId)
                        }}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white font-medium"
                      >
                        {displayClasses.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Section Assignment <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {modalClassSections.map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setNewStudent(prev => ({ ...prev, sectionId: sec }))
                              clearFieldError('sectionId')
                            }}
                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                              newStudent.sectionId === sec
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newStudent.sectionId}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, sectionId: e.target.value.toUpperCase() })
                          clearFieldError('sectionId')
                        }}
                        placeholder="Custom Section (e.g. C, D)"
                        className="w-full mt-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 uppercase font-bold"
                      />
                    </div>
                  </div>

                  {/* Joining Date & Previous School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Date of Admission / Joining
                      </label>
                      <input
                        type="date"
                        value={newStudent.joiningDate}
                        onChange={(e) => setNewStudent({ ...newStudent, joiningDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Previous School / Institute
                      </label>
                      <input
                        type="text"
                        value={newStudent.previousSchool}
                        onChange={(e) => setNewStudent({ ...newStudent, previousSchool: e.target.value })}
                        placeholder="e.g. Army Public School, City School"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
  )
}
