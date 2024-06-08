// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/sdk/**'],
    globalSetup: './src/vitest/globalSetup.ts',
    testTimeout: 30000, // 30 seconds
    fileParallelism: false,
  },
});
