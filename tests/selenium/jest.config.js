/** @type {import('jest').Config} */
module.exports = {
  // Run tests sequentially — Selenium cannot share a browser across parallel workers
  testRunner:      'jest-circus/runner',
  testEnvironment: 'node',
  testMatch:       ['**/tests/**/*.test.js'],
  testTimeout:     120_000,    // 2 minutes per test (AI edge-function calls can be slow)

  // Sequential execution is REQUIRED for Selenium
  maxWorkers: 1,

  // Exclude the old premium test (user does not want premium tests)
  testPathIgnorePatterns: [
    '/node_modules/',
    'test_05_premium',
    'test_06_vault',
  ],

  // Custom reporter → generates Excel report after the run
  reporters: [
    'default',
    '<rootDir>/customReporter.js',
  ],

  // Verbose output
  verbose: true,

  // Setup file (loads .env)
  globalSetup: '<rootDir>/globalSetup.js',
};
