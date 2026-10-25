import React from 'react'
import {
  User,
  Shield,
  HeartPulse,
  Phone,
  Edit3,
  Save,
  AlertCircle,
} from 'lucide-react'
import { formatDate } from '../../../../lib/formatters'
import Button from '../../../../components/ui/Button'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function PersonalMedicalTab({
  student,
  editMode,
  editForm,
  setEditForm,
  savingProfile,
  onSaveProfile,
  onCancelEdit,
  onStartEdit,
  calculateAge,
}) {
  return (
    <div className="space-y-6">
      {/* Edit Mode Top Banner */}
      {editMode && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 text-xs font-semibold">
            <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              You are in <strong>Inline Edit Mode</strong>. Modify the details below and click{' '}
              <strong>Save Changes</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Save}
              onClick={onSaveProfile}
              loading={savingProfile}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {!editMode ? (
        /* ── VIEW MODE ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Demographics */}
          <div className="card-surface p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Student Demographics & Identity
              </h3>
              <button
                onClick={onStartEdit}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">Full Name</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.fullName || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">
                  Date of Birth & Age
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.dob ? formatDate(student.dob) : '—'}
                </p>
                {student.dob && (
                  <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
                    ({calculateAge(student.dob)})
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">Gender</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.gender || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">
                  B-Form / CNIC No.
                </p>
                <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm mt-0.5">
                  {student.bFormNumber || (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">Blood Group</p>
                <p className="font-bold text-rose-600 text-sm mt-0.5">
                  {student.bloodGroup || (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">
                  Nationality & Religion
                </p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.nationality || '—'} · {student.religion || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">City</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.city || '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-2xs">Previous School</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                  {student.previousSchool || (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-semibold uppercase text-2xs">
                  Residential Address
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                  {student.address || (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Guardian & Emergency */}
          <div className="space-y-6">
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Primary Guardian & Family Details
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                {student.fatherName && (
                  <div className="col-span-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-2xs">
                        Father's Name (Official Record)
                      </p>
                      <p className="font-bold text-indigo-950 dark:text-indigo-300 text-sm mt-0.5">
                        {student.fatherName}
                      </p>
                    </div>
                    {student.guardian?.relationship !== 'Father' && (
                      <span className="text-2xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                        Guardian: {student.guardian?.relationship || 'Appointed'}
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">Guardian Name</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.guardian?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">Relationship</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.guardian?.relationship || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">
                    Primary Contact Phone
                  </p>
                  <p className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mt-0.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    {student.guardian?.phone || (
                      <span className="text-slate-400 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">Guardian Email</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5 truncate">
                    {student.guardian?.email || (
                      <span className="text-slate-400 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">Guardian CNIC</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {student.guardian?.cnic || (
                      <span className="text-slate-400 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">Occupation</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {student.guardian?.occupation || (
                      <span className="text-slate-400 font-normal italic">—</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Health & Medical Notes */}
            <div className="card-surface p-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Medical Notes & Emergency Contacts
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">
                    Emergency Contact
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {student.emergencyContact?.name || student.guardian?.name || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {student.emergencyContact?.phone || student.guardian?.phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-2xs">
                    Medical Notes & Allergies
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-0.5">
                    {student.medicalNotes || (
                      <span className="text-slate-400 font-normal italic">—</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── INLINE EDIT MODE ─────────────────────────────────────── */
        <form onSubmit={onSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit Student Demographics */}
            <div className="card-surface p-6 space-y-4 border-indigo-200 dark:border-indigo-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Student Demographics
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Full Name *
                  </label>
                  <input
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
                    <input
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
                    <select
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
                    <input
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
                    <select
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
                    <input
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
                    <input
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
                    <input
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
                    <input
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
                  <textarea
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
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Father & Guardian Information
                </h3>

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
                              ? 'bg-emerald-600 text-white shadow-xs'
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
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          Deceased
                        </button>
                      </div>
                    </div>
                    <input
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
                          <input
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
                          <select
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
                      <input
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
                      <input
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
                      <input
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
                      <input
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
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  Medical & Emergency Contacts
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Emergency Contact Name
                      </label>
                      <input
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
                      <input
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
                    <textarea
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
      )}
    </div>
  )
}
