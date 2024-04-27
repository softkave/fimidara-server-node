// eslint-disable-next-line node/no-unpublished-import
import {JestConfigWithTsJest} from 'ts-jest/dist/types';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/', '/testUtils.ts'],
  testTimeout: 300000, // 300 seconds
  transformIgnorePatterns: ['/node_modules/(?!(nanoid)/)'],
};

module.exports = config;
