import { test as base, expect, type Page } from '@playwright/test';
import { NumoApiMock } from './numoApiMock';

// Every numo-api call goes through the Next.js server (Server Actions), so a
// browser request to /api/ is a bug: it fails the test.
const API_ROUTE = '**/api/**';

type TestFixtures = { numoApiCheck: void };
type WorkerFixtures = { numoApi: NumoApiMock };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  numoApi: [
    // Playwright reads a fixture's dependencies from its first parameter, so
    // it must stay an object pattern even when there are none.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const numoApi = new NumoApiMock();
      await numoApi.start();
      await use(numoApi);
      await numoApi.stop();
    },
    { scope: 'worker' },
  ],
  numoApiCheck: [
    async ({ numoApi }, use) => {
      numoApi.reset();
      await use();
      expect(
        numoApi.unmockedCalls,
        'numo-api calls without a numoApi mock',
      ).toEqual([]);
    },
    { auto: true },
  ],
  page: async ({ page }, use) => {
    const browserErrors = collectBrowserErrors(page);
    const apiRequests = await rejectApiRequests(page);
    await use(page);
    expect(apiRequests, 'browser requests to /api/').toEqual([]);
    expect(browserErrors, 'browser console errors').toEqual([]);
  },
});

export { expect };

function collectBrowserErrors(page: Page): string[] {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  return browserErrors;
}

async function rejectApiRequests(page: Page): Promise<string[]> {
  const apiRequests: string[] = [];
  await page.route(API_ROUTE, (route) => {
    const request = route.request();
    apiRequests.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });
  return apiRequests;
}
