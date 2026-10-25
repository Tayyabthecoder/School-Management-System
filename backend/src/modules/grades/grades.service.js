/**
 * Pure business calculation functions for Grades module
 */

const calculatePercentage = (marksObtained, maxMarks = 100) => {
  const obtained = Math.max(0, Number(marksObtained) || 0)
  const max = Math.max(1, Number(maxMarks) || 100)
  return Math.round((obtained / max) * 100)
}

const calculateGradeLetter = (percentage, gradingScale = null) => {
  const pct = Number(percentage) || 0
  if (gradingScale && Array.isArray(gradingScale) && gradingScale.length > 0) {
    const sorted = [...gradingScale].sort((a, b) => b.minPercent - a.minPercent)
    const match = sorted.find(g => pct >= g.minPercent)
    return match ? match.label : 'F'
  }
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

const isPassingGrade = (marksObtained, passMarks = 40, passingPercentage = null, maxMarks = 100) => {
  const obtained = Number(marksObtained) || 0
  if (passingPercentage !== null && passingPercentage !== undefined) {
    const max = Math.max(1, Number(maxMarks) || 100)
    const pct = (obtained / max) * 100
    return pct >= passingPercentage
  }
  const pass = Number(passMarks) || 40
  return obtained >= pass
}

module.exports = {
  calculatePercentage,
  calculateGradeLetter,
  isPassingGrade,
}
