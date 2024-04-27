// eslint-disable-next-line node/no-unpublished-import
import {JestConfigWithTsJest} from 'ts-jest/dist/types';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/', '/testUtils.ts'],
  testTimeout: 30000,
  globalTeardown: './src/jest/globalTeardown.ts',
  globalSetup: './src/jest/globalSetup.unit-test.ts',
  transformIgnorePatterns: ['/node_modules/(?!(nanoid)/)'],
};

module.exports = config;
