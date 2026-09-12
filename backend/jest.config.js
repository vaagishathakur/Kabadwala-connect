// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/db/seeds/'],
  testTimeout: 15000,
  // Use a test SQLite DB — don't touch prod DB during tests
  setupFiles: ['./tests/setup.js'],
  setupFilesAfterEnv: ['./tests/setup-db.js']
};
