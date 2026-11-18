import {
  test as base,
  type ConsoleMessage,
  expect,
  type Page,
} from '@playwright/test';

// The app reaches numo-api through its /api proxy; tests mock every such call.
const API_ROUTE = '**/api/**';
const API_URL = /^https?:\/\/[^/]+\/api\//;

export const test = base.extend({
  page: async ({ page }, use) => {
    const browserErrors = collectBrowserErrors(page);
    const unmockedApiCalls = await rejectUnmockedApiCalls(page);
    await use(page);
    expect(unmockedApiCalls, 'API calls without a page.route() mock').toEqual(
      [],
    );
    expect(browserErrors, 'browser console errors').toEqual([]);
  },
});

export { expect };

function collectBrowserErrors(page: Page): string[] {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !isMockedApiFailure(message)) {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  return browserErrors;
}

// Chromium logs every non-2xx response, even one the app handles on purpose
// (a 401 for a wrong password). API responses are always mocked here, so
// their status is the test's choice, not a bug.
function isMockedApiFailure(message: ConsoleMessage): boolean {
  return (
    message.text().startsWith('Failed to load resource') &&
    API_URL.test(message.location().url)
  );
}

// Registered before the test runs, so a test's own page.route() wins over it.
async function rejectUnmockedApiCalls(page: Page): Promise<string[]> {
  const unmockedApiCalls: string[] = [];
  await page.route(API_ROUTE, (route) => {
    const request = route.request();
    unmockedApiCalls.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });
  return unmockedApiCalls;
}
