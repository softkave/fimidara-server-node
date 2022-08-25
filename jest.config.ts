import {InitialOptionsTsJest} from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/'],
  testTimeout: 30000,
  globalTeardown: './src/jest/globalTeardown.ts',
  globalSetup: './src/jest/globalSetup.unit-test.ts',
};

module.exports = config;
