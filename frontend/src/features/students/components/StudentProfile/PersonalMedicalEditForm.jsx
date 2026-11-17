import React from 'react'
import { User, Shield, HeartPulse, Phone, Save, AlertCircle } from 'lucide-react'
import Button from '../../../../components/ui/Button'

/** Inline edit form of the student's personal and medical details. */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function PersonalMedicalEditForm({
  student,
  editForm,
  setEditForm,
  savingProfile,
  onSaveProfile,
  onCancelEdit,
}) {
  return (
          <form onSubmit={onSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Edit Student Demographics */}
              <div className="card-surface p-6 space-y-4 border-indigo-200 dark:border-indigo-800">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Student Demographics
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Full Name *
                    </label>
                    <input aria-label="Full Name"
                      type="text"
                      required
                      value={editForm.fullName || ''}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Date of Birth *
                      </label>
                      <input aria-label="Date of Birth"
                        type="date"
                        required
                        value={editForm.dob || ''}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Gender *
                      </label>
                      <select aria-label="Gender"
                        value={editForm.gender || 'Male'}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        B-Form / CNIC
                      </label>
                      <input aria-label="B-Form / CNIC"
                        type="text"
                        placeholder="e.g. 42101-1234567-1"
                        value={editForm.bFormNumber || ''}
                        onChange={(e) => setEditForm({ ...editForm, bFormNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Blood Group
                      </label>
                      <select aria-label="Blood Group"
                        value={editForm.bloodGroup || ''}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="">Select blood group</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Nationality
                      </label>
                      <input aria-label="Nationality"
                        type="text"
                        value={editForm.nationality || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nationality: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Religion
                      </label>
                      <input aria-label="Religion"
                        type="text"
                        value={editForm.religion || ''}
                        onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        City
                      </label>
                      <input aria-label="City"
                        type="text"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Previous School
                      </label>
                      <input aria-label="Previous School"
                        type="text"
                        value={editForm.previousSchool || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, previousSchool: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Residential Address
                    </label>
                    <textarea aria-label="Residential Address"
                      rows={2}
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Family & Guardian Details */}
              <div className="space-y-6">
                <div className="card-surface p-6 space-y-4 border-indigo-200 dark:border-indigo-800">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Father & Guardian Information
                  </h2>

                  <div className="space-y-3 text-xs">
                    {/* Father's Name & Status Toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold">
                          Father's Full Name *
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400">
                            Father Status:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                fatherStatus: 'Alive',
                                guardianRelationship: 'Father',
                              })
                            }
                            className={`px-2 py-0.5 rounded-full text-2xs font-bold transition-all ${
                              editForm.fatherStatus === 'Alive'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            Alive
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                fatherStatus: 'Deceased',
                                guardianRelationship:
                                  editForm.guardianRelationship === 'Father'
                                    ? 'Mother'
                                    : editForm.guardianRelationship,
                              })
                            }
                            className={`px-2 py-0.5 rounded-full text-2xs font-bold transition-all ${
                              editForm.fatherStatus === 'Deceased'
                                ? 'bg-amber-700 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            Deceased
                          </button>
                        </div>
                      </div>
                      <input aria-label="Father's full name"
                        type="text"
                        placeholder="Father's full name"
                        value={editForm.fatherName || ''}
                        onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    {/* If Deceased, show Appointed Guardian fields */}
                    {editForm.fatherStatus === 'Deceased' && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-3">
                        <p className="text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Appointed Guardian Details (Required for Deceased Father)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              Guardian Name *
                            </label>
                            <input aria-label="Guardian Name"
                              type="text"
                              placeholder="e.g. Mother, Uncle, Brother"
                              value={editForm.guardianName || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, guardianName: e.target.value })
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                              Relationship
                            </label>
                            <select aria-label="Relationship"
                              value={editForm.guardianRelationship || 'Mother'}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  guardianRelationship: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          {editForm.fatherStatus === 'Alive'
                            ? "Father's Phone"
                            : "Guardian's Phone"}
                        </label>
                        <input aria-label="0300-1234567"
                          type="tel"
                          placeholder="0300-1234567"
                          value={editForm.guardianPhone || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, guardianPhone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          {editForm.fatherStatus === 'Alive'
                            ? "Father's Email"
                            : "Guardian's Email"}
                        </label>
                        <input aria-label="guardian@example.com"
                          type="email"
                          placeholder="guardian@example.com"
                          value={editForm.guardianEmail || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, guardianEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          CNIC
                        </label>
                        <input aria-label="CNIC"
                          type="text"
                          placeholder="42101-1234567-1"
                          value={editForm.guardianCnic || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, guardianCnic: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Occupation
                        </label>
                        <input aria-label="Occupation"
                          type="text"
                          placeholder="e.g. Engineer, Business"
                          value={editForm.guardianOccupation || ''}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              guardianOccupation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Emergency & Medical */}
                <div className="card-surface p-6 space-y-4 border-indigo-200 dark:border-indigo-800">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <HeartPulse className="w-5 h-5 text-rose-500" />
                    Medical & Emergency Contacts
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Emergency Contact Name
                        </label>
                        <input aria-label="Emergency Contact Name"
                          type="text"
                          value={editForm.emergencyName || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, emergencyName: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Emergency Phone
                        </label>
                        <input aria-label="Emergency Phone"
                          type="tel"
                          value={editForm.emergencyPhone || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, emergencyPhone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Medical Notes & Allergies
                      </label>
                      <textarea aria-label="Medical Notes & Allergies"
                        rows={2}
                        placeholder="e.g. Asthma, Peanut Allergy, None"
                        value={editForm.medicalNotes || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, medicalNotes: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons in Edit Mode */}
            <div className="flex items-center justify-end gap-3 p-4 card-surface">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                Cancel Edit
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                loading={savingProfile}
              >
                Save Changes
              </Button>
            </div>
          </form>
  )
}
