import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  GRADE_THEMES,
  FALLBACK_GRADES,
  getGradeTheme,
  formatGradeName,
  resolveDisplayClasses,
  extractSectionNames,
} from '../src/constants/grades.js'

describe('Frontend Grades & Themes Constant Test Suite', () => {
  test('GRADE_THEMES contains 12 thematic color palettes', () => {
    assert.equal(GRADE_THEMES.length, 12)
    GRADE_THEMES.forEach((theme) => {
      assert.ok(theme.gradient, 'Theme has gradient')
      assert.ok(theme.shadow, 'Theme has shadow class')
    })
  })

  test('FALLBACK_GRADES covers grades from Play Junior through Grade 12', () => {
    assert.equal(FALLBACK_GRADES.length, 13) // Play Junior + 12 grades
    assert.equal(FALLBACK_GRADES[0].name, 'Play Junior')
    assert.equal(FALLBACK_GRADES[12].name, 'Grade 12')
  })

  test('getGradeTheme returns appropriate theme object for given level', () => {
    const theme1 = getGradeTheme(1)
    const theme10 = getGradeTheme(10)
    assert.ok(theme1.gradient)
    assert.ok(theme10.gradient)
  })

  test('formatGradeName formats levels properly', () => {
    assert.equal(formatGradeName(10), 'Grade 10')
    assert.equal(formatGradeName(0), 'Grade')
  })

  test('resolveDisplayClasses returns classes if non-empty array, or FALLBACK_GRADES if empty or invalid', () => {
    const custom = [{ _id: '1', name: 'Custom Grade' }]
    assert.deepEqual(resolveDisplayClasses(custom), custom)
    assert.deepEqual(resolveDisplayClasses([]), FALLBACK_GRADES)
    assert.deepEqual(resolveDisplayClasses(null), FALLBACK_GRADES)
    assert.deepEqual(resolveDisplayClasses(undefined), FALLBACK_GRADES)
  })

  test('extractSectionNames returns string names or defaults to A, B', () => {
    assert.deepEqual(extractSectionNames({ sections: ['Alpha', 'Beta'] }), ['Alpha', 'Beta'])
    assert.deepEqual(extractSectionNames({ sections: [{ name: 'S1' }, { name: 'S2' }] }), ['S1', 'S2'])
    assert.deepEqual(extractSectionNames({ sections: [] }), ['A', 'B'])
    assert.deepEqual(extractSectionNames(null), ['A', 'B'])
  })
})
