// eslint-disable-next-line node/no-unpublished-import
import {JestConfigWithTsJest} from 'ts-jest/dist/types';

const config: JestConfigWithTsJest = {
  // preset: 'ts-jest',
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    // '^.+\\.tsx?$': [
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/', '/testUtils.ts', '/sdk/'],
  testTimeout: 300000, // 300 seconds
  globalTeardown: './build/src/jest/globalTeardown.js',
  globalSetup: './build/src/jest/globalSetup.unit-test.js',
  transformIgnorePatterns: ['/node_modules/(?!(nanoid)/)'],
};

module.exports = config;
