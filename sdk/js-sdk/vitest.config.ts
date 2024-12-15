// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
    fileParallelism: true,
    exclude: [
      '**/build/**',
      '**/node_modules/**',
      '**/.yalc/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/*.browser.{test,spec}.ts',
    ],
    env: {...process.env, FIMIDARA_TEST_CWD: process.cwd()},
  },
  server: {
    fs: {
      allow: [
        // search up for workspace root
        // searchForWorkspaceRoot(process.cwd()),
        // your custom rules
        '/src/testutils/testdata',
      ],
    },
  },
});
