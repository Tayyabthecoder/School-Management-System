const AcademicYear = require('../models/AcademicYear.model')
const { invalidateCache } = require('../utils/cache.util')

const ACADEMIC_YEAR_CACHE_KEYS = ['ref:academic-years:all', 'dashboard:stats']

const invalidateAcademicYearCaches = () =>
  Promise.all(ACADEMIC_YEAR_CACHE_KEYS.map((key) => invalidateCache(key)))

/**
 * Makes `yearId` the only active academic year. Others are deactivated first so the
 * partial unique index on { isActive: true } is never violated.
 */
const activateAcademicYear = async (yearId, Model = AcademicYear) => {
  const target = await Model.findById(yearId)
  if (!target) return null

  await Model.updateMany({ _id: { $ne: target._id }, isActive: true }, { $set: { isActive: false } })
  const activated = await Model.findByIdAndUpdate(target._id, { $set: { isActive: true } }, { new: true })
  await invalidateAcademicYearCaches()
  return activated
}

/**
 * Picks which year should stay active when an existing database has several (or none)
 * active: the one whose dates contain `now`, otherwise the latest year.
 */
const chooseActiveYear = (years, now = new Date()) => {
  if (!years.length) return null
  const current = years.find((y) => new Date(y.startDate) <= now && now <= new Date(y.endDate))
  if (current) return current
  return [...years].sort((a, b) => Number(b.year) - Number(a.year))[0]
}

/**
 * Startup repair for databases created before the single-active rule: leaves exactly one
 * active year (if any exist) and then builds the unique index.
 */
const normalizeActiveAcademicYear = async (Model = AcademicYear, now = new Date()) => {
  const active = await Model.find({ isActive: true }).lean()
  let keptId = active.length === 1 ? active[0]._id : null

  if (active.length !== 1) {
    const candidates = active.length > 1 ? active : await Model.find().lean()
    const keep = chooseActiveYear(candidates, now)
    if (keep) {
      await Model.updateMany({ _id: { $ne: keep._id }, isActive: true }, { $set: { isActive: false } })
      await Model.updateOne({ _id: keep._id }, { $set: { isActive: true } })
      keptId = keep._id
    }
  }

  await Model.createIndexes()
  return { previouslyActive: active.length, activeId: keptId }
}

module.exports = {
  activateAcademicYear,
  chooseActiveYear,
  normalizeActiveAcademicYear,
  invalidateAcademicYearCaches,
}
