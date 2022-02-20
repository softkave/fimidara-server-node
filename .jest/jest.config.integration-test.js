/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: '/.jest/globalSetup.integration-test.js',
  globalTeardown: '/.jest/globalTeardown.js',
};
