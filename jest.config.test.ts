import {InitialOptionsTsJest} from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'jest.config.test.ts',
    'jest.config.integration-test.ts',
    '/jest/',
    '/build/',
  ],
  testTimeout: 30000,
  globalTeardown: './jest/globalTeardown.ts',
  globalSetup: './jest/globalSetup.unit-test.ts',
};

module.exports = config;
