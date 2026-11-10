module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  // Ratchet gate for CI (LOW-11): fails if coverage drops below today's level. Raise these
  // numbers as tests are added; the audit target is 80%.
  coverageThreshold: {
    global: { statements: 65, branches: 43, functions: 54, lines: 67 },
  },
}
