import React from 'react'
import { CircleDollarSign, Users, Sparkles, ChevronRight } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { formatPKR } from '../../../lib/formatters'
import { GRADE_THEMES } from '../../../constants/grades'

/** Level 1 of the Finance page: grade cards. */
export default function FeeGradePicker({
  displayClasses,
  handleSelectGrade,
  getSectionsForGrade,
  students,
  studentFees,
}) {
  return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Select Academic Grade (1–12)
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Pick a grade level to review fee ledgers, manage concessions, and print 3-part bank fee challans.
                </p>
              </div>
              <Badge variant="indigo">{displayClasses.length} Grades Configured</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayClasses.map((cls, index) => {
                const theme = GRADE_THEMES[index % GRADE_THEMES.length]
                const gradeStudents = students.filter(
                  (s) =>
                    s.classId &&
                    (s.classId._id === cls._id ||
                      s.classId === cls._id ||
                      s.classId?.name === cls.name)
                ).length
                const classSections = getSectionsForGrade(cls)
                const classFee = studentFees.find(
                  (f) =>
                    f.studentId?.classId &&
                    (f.studentId.classId === cls._id ||
                      f.studentId.classId._id === cls._id ||
                      f.studentId.classId?.name === cls.name)
                )
                const monthlyAmount = classFee?.amountDue || (8000 + (cls.level || 0) * 500)

                return (
                  <div
                    key={cls._id || cls.name}
                    onClick={() => handleSelectGrade(cls)}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-lg ${theme.shadow} hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-xs font-bold uppercase">
                        Level {cls.level}
                      </span>
                      <CircleDollarSign className="w-6 h-6 text-white/90" />
                    </div>

                    <h3 className="text-2xl font-extrabold mb-1">{cls.name}</h3>
                    <p className="text-xs text-white/80 font-medium mb-4">
                      Sections: {classSections.join(', ')} • {formatPKR(monthlyAmount)}/mo
                    </p>

                    <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {gradeStudents} Students
                      </span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View Fee Ledger <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
  )
}
