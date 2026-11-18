import type { Page } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';

// These run on a blank page instead of the app, so the deliberate errors below
// aren't echoed by the dev server's browser-log forwarding.
const BLANK_PAGE = '<h1>Fixture check</h1>';

// A same-origin page served by the test itself, so relative /api calls work
// without reaching the dev server.
const FAKE_APP_PAGE = '/fixture-check';

async function openFakeAppPage(page: Page) {
  await page.route(FAKE_APP_PAGE, (route) =>
    route.fulfill({ contentType: 'text/html', body: BLANK_PAGE }),
  );
  await page.goto(FAKE_APP_PAGE);
}

test.describe('e2e page fixture', () => {
  test('passes when the browser logs no errors', async ({ page }) => {
    await page.setContent(BLANK_PAGE);

    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('(expected failure) fails the test on a console error', async ({
    page,
  }) => {
    test.fail();
    await page.setContent(BLANK_PAGE);

    await page.evaluate(() => console.error('boom'));
  });

  test('(expected failure) fails the test on an uncaught page error', async ({
    page,
  }) => {
    test.fail();
    await page.setContent(BLANK_PAGE);

    await Promise.all([
      page.waitForEvent('pageerror'),
      page.evaluate(() => {
        setTimeout(() => {
          throw new Error('boom');
        });
      }),
    ]);
  });
});

test.describe('e2e page fixture and the API', () => {
  test('passes when a mocked API call fails on purpose', async ({ page }) => {
    await openFakeAppPage(page);
    await page.route('**/api/check', (route) => route.fulfill({ status: 500 }));

    const status = await page.evaluate(
      async () => (await fetch('/api/check')).status,
    );

    expect(status).toBe(500);
  });

  test('(expected failure) fails the test on an API call nobody mocked', async ({
    page,
  }) => {
    test.fail();
    await openFakeAppPage(page);

    await page.evaluate(() => fetch('/api/check').catch(() => undefined));
  });
});
