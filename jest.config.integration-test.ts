import {InitialOptionsTsJest} from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/'],
  testTimeout: 30000,
  globalTeardown: './jest/globalTeardown.ts',
  globalSetup: './jest/globalSetup.integration-test.ts',
};

module.exports = config;
