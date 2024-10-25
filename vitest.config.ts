// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/sdk/**',
      '**/build/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    globalSetup: './src/vitest/globalSetup.ts',
    testTimeout: 15000, // 30 seconds
    fileParallelism: false,
  },
});
