import React from 'react'
import {
  BookOpen,
  Award,
  CheckCircle2,
  Download,
} from 'lucide-react'
import Button from '../../../../components/ui/Button'

const GRADE_BADGES = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  A: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
  B: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800',
  D: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
  F: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
}

export default function AcademicRecordsTab({
  type = 'grades', // 'academics' | 'grades'
  student,
  grades = [],
  subjectsList = [],
  overallAvgPct,
  onDownloadReportCard,
}) {
  if (type === 'academics') {
    return (
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Curriculum Subjects ({student?.classId?.name || 'Class'})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Standard academic course curriculum enrolled for the current academic session.
            </p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            {subjectsList.length} Subjects Active
          </span>
        </div>

        {subjectsList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsList.map((sub, idx) => {
              const subGrade = grades.find((g) => {
                const sId = g.examId?.subjectId?._id || g.examId?.subjectId
                const sName = g.examId?.subjectId?.name
                return (
                  (sub._id && sId && String(sId) === String(sub._id)) ||
                  (sub.name && sName && sName.toLowerCase() === sub.name.toLowerCase())
                )
              })

              return (
                <div
                  key={sub._id || idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all hover:shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {sub.name}
                      </span>
                      <span className="font-mono text-2xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {sub.code || 'CORE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Academic Subject · Mandatory Core
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                    </div>

                    {subGrade ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {subGrade.percentage}%
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${
                            GRADE_BADGES[subGrade.gradeLetter] ||
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {subGrade.gradeLetter}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xs text-slate-400 font-medium italic">
                        Not assessed yet
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            No subjects registered for this class. Configure class subjects in the Academic module.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Cumulative Academic Performance
          </h3>
          <p className="text-xs text-indigo-200 mt-1">
            Exam marks, percentages, and teacher remarks across all published assessment terms.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-indigo-200 uppercase font-semibold">Aggregate Score</span>
            <p className="text-2xl font-black text-amber-300">
              {overallAvgPct !== null ? `${overallAvgPct}%` : '—'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={onDownloadReportCard}
            className="bg-white text-indigo-900 hover:bg-indigo-50 border-white"
          >
            Export Report Card (.pdf)
          </Button>
        </div>
      </div>

      {/* Grades Table */}
      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/80 dark:border-slate-800">
          <div className="col-span-4">Exam & Subject</div>
          <div className="col-span-2 text-center">Marks Obtained</div>
          <div className="col-span-2 text-center">Percentage</div>
          <div className="col-span-2 text-center">Grade Letter</div>
          <div className="col-span-2 text-right">Remarks</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {grades.length > 0 ? (
            grades.map((g) => (
              <div
                key={g._id}
                className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs"
              >
                <div className="col-span-4">
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {g.examId?.title || 'Examination'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {g.examId?.subjectId?.name || 'Subject'} · {g.examId?.termName || 'Term 1'}
                  </p>
                </div>
                <div className="col-span-2 text-center font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {g.marksObtained}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    / {g.examId?.maxMarks || 100}
                  </span>
                </div>
                <div className="col-span-2 text-center font-bold text-sm">
                  <span
                    className={
                      g.percentage >= 50
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {g.percentage}%
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold border ${
                      GRADE_BADGES[g.gradeLetter] ||
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {g.gradeLetter}
                  </span>
                </div>
                <div className="col-span-2 text-right text-slate-500 dark:text-slate-400 italic">
                  {g.remarks || '—'}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No exam marks recorded yet for this student.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
