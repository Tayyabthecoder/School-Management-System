module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  // CI gate (LOW-11). Statements, lines and functions meet the audit's 80% target; branches
  // are a ratchet at today's level. *.integration.test.js suites need MongoDB (TEST_MONGODB_URI).
  coverageThreshold: {
    global: { statements: 88, branches: 68, functions: 88, lines: 90 },
  },
}
