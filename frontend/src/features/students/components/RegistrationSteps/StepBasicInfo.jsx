import React from 'react'
import { User, Camera, Upload, Trash2, AlertCircle } from 'lucide-react'

export default function StepBasicInfo({
  newStudent,
  setNewStudent,
  formErrors,
  photoPreview,
  photoUploading,
  handlePhotoUpload,
  fileInputRef,
}) {
  return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Student Identity & Demographics</h3>
                  </div>

                  {/* Photo Upload Card */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div className="relative group">
                      {newStudent.photoUrl ? (
                        <img
                          src={newStudent.photoUrl}
                          alt="Student Preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center text-indigo-600">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold uppercase">No Photo</span>
                        </div>
                      )}
                      {newStudent.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewStudent(prev => ({ ...prev, photoUrl: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <label className="block text-xs font-bold text-gray-900 mb-0.5">Student Profile Photo</label>
                      <p className="text-[11px] text-gray-500 mb-2">Upload student passport-sized portrait (PNG, JPG under 3MB).</p>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{newStudent.photoUrl ? 'Change Photo' : 'Upload Student Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Name & DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newStudent.fullName}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, fullName: e.target.value })
                          clearFieldError('fullName')
                        }}
                        placeholder="e.g. Muhammad Bilal"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.fullName
                            ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newStudent.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setNewStudent({ ...newStudent, dob: e.target.value })
                          clearFieldError('dob')
                        }}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                          formErrors.dob
                            ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-400'
                            : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                        }`}
                      />
                      {formErrors.dob && (
                        <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.dob}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gender & B-Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newStudent.gender}
                        onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                        B-Form / CNIC Number
                      </label>
                      <input
                        type="text"
                        value={newStudent.bFormNumber}
                        onChange={(e) => setNewStudent({ ...newStudent, bFormNumber: e.target.value })}
                        placeholder="e.g. 42101-1234567-1"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Nationality, Religion & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nationality</label>
                      <input
                        type="text"
                        value={newStudent.nationality}
                        onChange={(e) => setNewStudent({ ...newStudent, nationality: e.target.value })}
                        placeholder="Pakistani"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Religion</label>
                      <input
                        type="text"
                        value={newStudent.religion}
                        onChange={(e) => setNewStudent({ ...newStudent, religion: e.target.value })}
                        placeholder="Islam"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">City</label>
                      <input
                        type="text"
                        value={newStudent.city}
                        onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                        placeholder="Karachi"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Residential Address</label>
                    <textarea
                      rows={2}
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      placeholder="e.g. House # 12, Block 4, Gulshan-e-Iqbal, Karachi"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none"
                    />
                  </div>
                </div>
  )
}
