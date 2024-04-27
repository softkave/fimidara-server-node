/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/jest/', '/build/'],
  testTimeout: 300000, // 300 seconds
  transformIgnorePatterns: ['/node_modules/(?!(nanoid)/)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {tsconfig: './test.tsconfig.json'}],
  },
};
