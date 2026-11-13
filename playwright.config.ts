import { defineConfig, devices } from '@playwright/test';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
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
    command: IS_CI ? 'yarn build && yarn start' : 'yarn dev',
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: WEB_SERVER_TIMEOUT_MS,
  },
});
