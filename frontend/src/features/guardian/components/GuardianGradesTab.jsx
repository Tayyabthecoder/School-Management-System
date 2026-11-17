import React from 'react'


/** Grades tab of the guardian portal. */
export default function GuardianGradesTab({
  terms,
  filteredGrades,
  grades,
  selectedTerm,
  setSelectedTerm,
}) {
  return (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Examination Marks & Performance</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Published examination grades</p>
              </div>

              {terms.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {terms.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTerm(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedTerm === t
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredGrades.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-xs">
                No examination marks published for this term yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Exam</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center">Marks Obtained</th>
                      <th className="p-3 text-center">Total Marks</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredGrades.map((g) => {
                      const marks = g.marksObtained ?? 0
                      const total = g.examId?.totalMarks || 100
                      const pct = Math.round((marks / total) * 100)
                      const isPassing = marks >= (g.examId?.passMarks || 33)

                      return (
                        <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-bold text-gray-900 dark:text-slate-100">{g.examId?.name || 'Term Exam'}</td>
                          <td className="p-3 font-semibold text-gray-700 dark:text-slate-300">{g.examId?.subjectId?.name || 'Subject'}</td>
                          <td className="p-3 text-center font-bold text-gray-900 dark:text-slate-100">{marks}</td>
                          <td className="p-3 text-center text-gray-500 dark:text-slate-400">{total}</td>
                          <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{pct}%</td>
                          <td className="p-3 text-center">
                            {isPassing ? (
                              <span className="text-green-700 dark:text-green-300 font-bold bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full text-[10px]">
                                Passed
                              </span>
                            ) : (
                              <span className="text-red-700 dark:text-red-300 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full text-[10px]">
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
  )
}
