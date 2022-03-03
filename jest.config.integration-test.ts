/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'jest.config.test.ts',
    'jest.config.integration-test.ts',
    '/jest/',
  ],
  globalTeardown: './jest/globalTeardown.ts',
};