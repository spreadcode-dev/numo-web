import { defineConfig, devices } from '@playwright/test';
import { NUMO_API_MOCK_URL } from './src/testing/numoApiMock';

// Its own server, not `yarn dev`'s 3001: that one talks to the real numo-api.
const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;
// Next.js locks its build directory, so a second server needs its own.
const E2E_DIST_DIR = '.next-e2e';
// Test-only key for the session cookie: never use it outside e2e.
const E2E_SESSION_SECRET = 'e2e-only-session-secret-never-use-it-for-real';
const IS_CI = Boolean(process.env.CI);
// A cold production build can take a few minutes; the dev server needs much less.
const WEB_SERVER_TIMEOUT_MS = 5 * 60 * 1000;

export default defineConfig({
  testDir: 'src',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  retries: 0,
  forbidOnly: IS_CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CI tests the real production build; locally the dev server iterates faster.
    command: IS_CI
      ? `yarn next build && yarn next start -p ${PORT}`
      : `yarn next dev -p ${PORT}`,
    url: BASE_URL,
    // Never `yarn dev`: e2e needs a server whose numo-api is the mock.
    reuseExistingServer: false,
    env: {
      NUMO_API_URL: NUMO_API_MOCK_URL,
      NEXT_DIST_DIR: E2E_DIST_DIR,
      SESSION_SECRET: E2E_SESSION_SECRET,
    },
    timeout: WEB_SERVER_TIMEOUT_MS,
  },
});
