// One runner for every frontend test: the component and router tests (Testing Library + jsdom) and the
// older logic tests in tests/*.test.js, which were written for node:test and run unchanged because
// `node:test` resolves to src/test/node-test-shim.js here.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

const here = path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: [{ find: /^node:test$/, replacement: path.resolve(here, 'src/test/node-test-shim.js') }],
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.js'],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'text', 'lcov'],
        include: ['src/components/**', 'src/routes/**', 'src/store/**', 'src/lib/**', 'src/hooks/**', 'src/config/**'],
        exclude: ['src/**/*.test.{js,jsx}', 'src/test/**'],
        // Measured on the shared building blocks (UI components, route guards and table, stores, hooks, lib).
        // The feature pages are exercised by the end-to-end suite instead. Today: 94 / 85 / 96 / 95.
        thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 },
      },
    },
  }),
)
