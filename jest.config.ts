import {InitialOptionsTsJest} from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/', '/testUtils.ts', '/sdk/'],
  testTimeout: 300000, // 300 seconds
  globalTeardown: './src/jest/globalTeardown.ts',
  globalSetup: './src/jest/globalSetup.unit-test.ts',
};

module.exports = config;
