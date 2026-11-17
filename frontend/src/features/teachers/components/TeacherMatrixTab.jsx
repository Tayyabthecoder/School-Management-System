import React from 'react'
import { BookOpen, CheckCircle2 } from 'lucide-react'

/** Workload matrix tab of the Teachers page. */
export default function TeacherMatrixTab({
  isAdmin,
  teachers,
  classes,
  subjects,
  allTimetable,
  setSelectedTeacherForAssign,
}) {
  return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Grade 1 to 12 Subject Faculty Allocations
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Overview of which teacher teaches each subject across classes and sections.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {classes.map((cls) => {
                  const classSubjects = subjects.filter((s) => (s.classId?._id || s.classId) === cls._id)
                  return (
                    <div key={cls._id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900 text-base">{cls.name}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                          Sections: {cls.sections?.join(', ') || 'A, B'}
                        </span>
                      </div>

                      <div className="space-y-2 mt-3">
                        {classSubjects.length > 0 ? (
                          classSubjects.map((sub) => {
                            const assignedEntry = allTimetable.find(
                              (tt) => (tt.classId?._id || tt.classId) === cls._id && (tt.subjectId?._id || tt.subjectId) === sub._id
                            )
                            const assignedTeacher = assignedEntry?.teacherId
                              ? (typeof assignedEntry.teacherId === 'object' ? assignedEntry.teacherId.fullName : assignedEntry.teacherId)
                              : null

                            return (
                              <div
                                key={sub._id}
                                className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 text-xs"
                              >
                                <div>
                                  <p className="font-bold text-gray-800">{sub.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{sub.code}</p>
                                </div>
                                <div className="text-right">
                                  {assignedTeacher ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {assignedTeacher}
                                    </span>
                                  ) : !isAdmin ? (
                                    <span className="text-xs text-gray-500">Unassigned</span>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedTeacherForAssign({ _id: teachers[0]?._id, fullName: 'Teacher' })}
                                      className="text-xs text-indigo-600 font-bold hover:underline"
                                    >
                                      + Assign Teacher
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-xs text-gray-500 italic py-2">No subjects configured for this grade</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
  )
}
