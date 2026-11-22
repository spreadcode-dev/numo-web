import type { Page } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';
import { NUMO_API_MOCK_URL } from '@/testing/numoApiMock';

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

// The test itself calls the mock, as the e2e Next.js server would.
function postToNumoApi(path: string, body: unknown): Promise<Response> {
  return fetch(`${NUMO_API_MOCK_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

test.describe('e2e page fixture and /api', () => {
  test('(expected failure) fails the test on any browser request to /api/', async ({
    page,
  }) => {
    test.fail();
    await openFakeAppPage(page);

    await page.evaluate(() => fetch('/api/check').catch(() => undefined));
  });
});

test.describe('numoApi fixture', () => {
  test('answers with the mocked reply and records the call', async ({
    numoApi,
  }) => {
    numoApi.respond('POST /auth/register', {
      status: 201,
      json: { id: 'user-1' },
    });

    const response = await postToNumoApi('/auth/register', {
      email: 'ana@example.com',
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: 'user-1' });
    expect(numoApi.calls).toEqual([
      {
        method: 'POST',
        path: '/auth/register',
        body: { email: 'ana@example.com' },
      },
    ]);
  });

  test('drops the connection when numo-api is down', async ({ numoApi }) => {
    numoApi.goDown('POST /auth/register');

    await expect(postToNumoApi('/auth/register', {})).rejects.toThrow(
      'fetch failed',
    );
  });

  test('(expected failure) fails the test on a numo-api call nobody mocked', async () => {
    test.fail();

    const response = await postToNumoApi('/auth/nobody-mocked-this', {});

    expect(response.status).toBe(500);
  });
});
