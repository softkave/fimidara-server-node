// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/sdk/**'],
    globalSetup: './src/vitest/globalSetup.ts',
    testTimeout: 300000, // 300 seconds
    fileParallelism: false,
  },
});
