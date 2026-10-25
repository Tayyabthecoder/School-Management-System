import React, { useMemo } from 'react'
import { GraduationCap, ChevronDown, Users } from 'lucide-react'
import { getGradeTheme } from '../../constants/grades'

export default function GradeSectionNavigator({
  grades = [],
  selectedGrade,
  selectedSection,
  onSelectGrade,
  onSelectSection,
  students = [],
  rightSlot,
  className = '',
}) {
  // Normalize selected grade object
  const currentGrade = useMemo(() => {
    if (!selectedGrade) return grades[0] || null
    if (typeof selectedGrade === 'object') return selectedGrade
    return grades.find((g) => g._id === selectedGrade) || grades[0] || null
  }, [grades, selectedGrade])

  const sections = useMemo(() => {
    if (!currentGrade) return ['A', 'B']
    if (Array.isArray(currentGrade.sections) && currentGrade.sections.length > 0) {
      return currentGrade.sections.map((s) => (typeof s === 'object' ? s.name : s))
    }
    return ['A', 'B']
  }, [currentGrade])

  // Count students in selected grade & section if students array provided
  const sectionCounts = useMemo(() => {
    if (!students || students.length === 0 || !currentGrade) return {}
    const counts = {}
    sections.forEach((sec) => {
      counts[sec] = students.filter(
        (s) =>
          (s.classId?._id || s.classId) === currentGrade._id &&
          (s.sectionId === sec || s.section === sec)
      ).length
    })
    return counts
  }, [students, currentGrade, sections])

  const totalGradeStudents = useMemo(() => {
    if (!students || students.length === 0 || !currentGrade) return null
    return students.filter((s) => (s.classId?._id || s.classId) === currentGrade._id).length
  }, [students, currentGrade])

  const theme = getGradeTheme(currentGrade?.level || 1)

  return (
    <div
      className={`card-surface p-3 sm:p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs ${className}`}
    >
      {/* Left: Grade Selector & Section Pills */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Grade Dropdown / Indicator */}
        <div className="relative inline-flex items-center">
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-xs mr-2.5 shrink-0`}
          >
            <GraduationCap className="w-5 h-5" />
          </div>

          <div className="relative">
            <select
              value={currentGrade?._id || ''}
              onChange={(e) => {
                const found = grades.find((g) => g._id === e.target.value)
                if (found) {
                  onSelectGrade?.(found)
                  // auto-select first section of new grade if current section not in it
                  const newSections = Array.isArray(found.sections) && found.sections.length > 0
                    ? found.sections.map((s) => (typeof s === 'object' ? s.name : s))
                    : ['A', 'B']
                  if (!newSections.includes(selectedSection)) {
                    onSelectSection?.(newSections[0] || 'A')
                  }
                }
              }}
              className="appearance-none font-bold text-slate-900 dark:text-slate-100 bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-3 pr-8 py-2 text-sm cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            >
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name || `Grade ${g.level}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {totalGradeStudents !== null && (
            <span className="hidden sm:inline-flex items-center gap-1 ml-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <Users className="w-3 h-3" />
              {totalGradeStudents}
            </span>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* Section Pills */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-2">
            Section
          </span>
          {sections.map((sec) => {
            const isSelected = selectedSection === sec
            const count = sectionCounts[sec]
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onSelectSection?.(sec)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <span>Section {sec}</span>
                {count !== undefined && (
                  <span
                    className={`text-2xs px-1.5 py-0.2 rounded-full tabular-nums ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Actions Slot (Batch Actions, Print Challans, etc.) */}
      {rightSlot && <div className="flex items-center gap-2 self-end md:self-auto">{rightSlot}</div>}
    </div>
  )
}
