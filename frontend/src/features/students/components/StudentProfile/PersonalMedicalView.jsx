import React from 'react'
import { User, Shield, HeartPulse, Phone, Edit3 } from 'lucide-react'
import { formatDate } from '../../../../lib/formatters'

/** Read-only view of the student's personal and medical details. */
export default function PersonalMedicalView({ student, calculateAge, onStartEdit }) {
  return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Demographics */}
            <div className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Student Demographics & Identity
                </h2>
                <button
                  onClick={onStartEdit}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">Full Name</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.fullName || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">
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
                  <p className="text-slate-500 font-semibold uppercase text-2xs">Gender</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.gender || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">
                    B-Form / CNIC No.
                  </p>
                  <p className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-sm mt-0.5">
                    {student.bFormNumber || (
                      <span className="text-slate-500 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">Blood Group</p>
                  <p className="font-bold text-rose-600 text-sm mt-0.5">
                    {student.bloodGroup || (
                      <span className="text-slate-500 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">
                    Nationality & Religion
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.nationality || '—'} · {student.religion || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">City</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.city || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold uppercase text-2xs">Previous School</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {student.previousSchool || (
                      <span className="text-slate-500 font-normal italic">—</span>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 font-semibold uppercase text-2xs">
                    Residential Address
                  </p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {student.address || (
                      <span className="text-slate-500 font-normal italic">—</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Guardian & Emergency */}
            <div className="space-y-6">
              <div className="card-surface p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Primary Guardian & Family Details
                  </h2>
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
                    <p className="text-slate-500 font-semibold uppercase text-2xs">Guardian Name</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                      {student.guardian?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">Relationship</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                      {student.guardian?.relationship || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">
                      Primary Contact Phone
                    </p>
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      {student.guardian?.phone || (
                        <span className="text-slate-500 font-normal italic">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">Guardian Email</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5 truncate">
                      {student.guardian?.email || (
                        <span className="text-slate-500 font-normal italic">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">Guardian CNIC</p>
                    <p className="font-mono text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {student.guardian?.cnic || (
                        <span className="text-slate-500 font-normal italic">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">Occupation</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      {student.guardian?.occupation || (
                        <span className="text-slate-500 font-normal italic">—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Health & Medical Notes */}
              <div className="card-surface p-6">
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  Medical Notes & Emergency Contacts
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                  <div>
                    <p className="text-slate-500 font-semibold uppercase text-2xs">
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
                    <p className="text-slate-500 font-semibold uppercase text-2xs">
                      Medical Notes & Allergies
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-0.5">
                      {student.medicalNotes || (
                        <span className="text-slate-500 font-normal italic">—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
  )
}
