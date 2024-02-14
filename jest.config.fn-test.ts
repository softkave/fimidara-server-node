import {InitialOptionsTsJest} from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/'],
  testTimeout: 300000, // 300 seconds
};

module.exports = config;
