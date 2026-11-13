import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const MINIMUM_COVERAGE_PERCENT = 80;

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias declared in tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Without `include`, Vitest only measures files the tests import, so an
      // untested file would never lower the percentage.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Root layouts render <html>/<body>, which jsdom can't mount inside a container.
        'src/**/layout.tsx',
        'src/**/*.spec.{ts,tsx}',
        // Browser-only code, covered by Playwright (`yarn test:e2e`) instead.
        'src/**/*.e2e.ts',
        'src/testing/**',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportOnFailure: true,
      thresholds: {
        lines: MINIMUM_COVERAGE_PERCENT,
        branches: MINIMUM_COVERAGE_PERCENT,
        functions: MINIMUM_COVERAGE_PERCENT,
        statements: MINIMUM_COVERAGE_PERCENT,
      },
    },
  },
});
