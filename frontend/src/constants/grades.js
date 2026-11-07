/**
 * Standardized 12-Grade Theme Gradients & Fallback Objects
 */
export const GRADE_THEMES = [
  { gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
  { gradient: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/20' },
  { gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/20' },
  { gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/20' },
  { gradient: 'from-rose-500 to-orange-600', shadow: 'shadow-rose-500/20' },
  { gradient: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
  { gradient: 'from-amber-500 to-yellow-600', shadow: 'shadow-amber-500/20' },
  { gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
  { gradient: 'from-teal-500 to-cyan-600', shadow: 'shadow-teal-500/20' },
  { gradient: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/20' },
  { gradient: 'from-sky-500 to-indigo-700', shadow: 'shadow-sky-500/20' },
  { gradient: 'from-violet-600 to-purple-800', shadow: 'shadow-violet-500/20' },
]

export const FALLBACK_GRADES = [
  { _id: 'fallback-grade-0', name: 'Play Junior', level: 0, sections: ['A', 'B', 'C'] },
  ...Array.from({ length: 12 }, (_, i) => ({
    _id: `fallback-grade-${i + 1}`,
    name: `Grade ${i + 1}`,
    level: i + 1,
    sections: ['A', 'B'],
  })),
]

export const getGradeTheme = (level) => {
  const index = Math.max(0, (level ? Number(level) - 1 : 0)) % GRADE_THEMES.length
  return GRADE_THEMES[index]
}

export const formatGradeName = (level) => {
  if (!level) return 'Grade'
  return `Grade ${level}`
}

/**
 * Normalizes an array of academic classes/grades, falling back to FALLBACK_GRADES if empty.
 * @param {Array} classes
 * @returns {Array}
 */
export const resolveDisplayClasses = (classes) => {
  return Array.isArray(classes) && classes.length > 0 ? classes : FALLBACK_GRADES
}

/**
 * Extracts normalized string section names from a class object.
 * @param {object} classObj
 * @returns {string[]}
 */
export const extractSectionNames = (classObj) => {
  if (!classObj || !Array.isArray(classObj.sections) || classObj.sections.length === 0) {
    return ['A', 'B']
  }
  return classObj.sections.map((s) => (typeof s === 'object' && s !== null ? s.name || 'A' : s))
}

export default {
  GRADE_THEMES,
  FALLBACK_GRADES,
  getGradeTheme,
  formatGradeName,
  resolveDisplayClasses,
  extractSectionNames,
}
