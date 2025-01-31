// eslint-disable-next-line node/no-unpublished-import
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000, // 30 seconds
    fileParallelism: true,
    include: ['**/*.browser.{test,spec}.ts'],
    exclude: [
      '**/build/**',
      '**/node_modules/**',
      '**/.yalc/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    env: {...process.env, FIMIDARA_TEST_CWD: process.cwd()},
    name: 'browser',
    browser: {
      enabled: true,
      headless: true,
      name: 'chromium',
      provider: 'playwright',
      screenshotFailures: false,
      // https://playwright.dev
    },
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
  define: {
    process: JSON.stringify({}),
    'process.env': JSON.stringify({}),
  },
});
