/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: '/.jest/globalSetup.test.js',
  globalTeardown: '/.jest/globalTeardown.js',
};
