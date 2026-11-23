import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';
import type { MockReply, NumoApiMock } from '@/testing/numoApiMock';

const LOGIN = 'POST /auth/login';
const REFRESH = 'POST /auth/refresh';
const CURRENT_USER = 'GET /auth/me';
const SESSION_COOKIE = 'numo_session';
const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const FRESH_SECONDS = 900;
// Inside the proxy's 60-second margin: the first request to /app refreshes.
const EXPIRING_SOON_SECONDS = 30;
// The page's own text: its static <title> ("Welcome · NuMo") is route
// metadata and also travels in the redirect's payload.
const WELCOME_TEXT = 'Your accounts and expenses will show up here.';

const KNOWN_USER: MockReply = {
  status: 200,
  json: { id: 'user-1', email: EMAIL },
};

type Tokens = Readonly<{ accessToken: string; refreshToken: string }>;

// The e2e server remembers successful refreshes for 30 s across tests, so
// every test signs in with tokens of its own.
function newTokens(): Tokens {
  const id = randomUUID();
  return { accessToken: `access-${id}`, refreshToken: `refresh-${id}` };
}

// numo-api answers login and refresh alike.
function issued(tokens: Tokens, expiresIn: number): MockReply {
  const expires = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS);
  return {
    status: 200,
    json: { accessToken: tokens.accessToken, tokenType: 'Bearer', expiresIn },
    headers: {
      'Set-Cookie': `refresh_token=${tokens.refreshToken}; Path=/auth; Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
    },
  };
}

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function sessionCookieValue(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE)?.value;
}

function callsTo(numoApi: NumoApiMock, route: string) {
  return numoApi.calls.filter(
    (call) => `${call.method} ${call.path}` === route,
  );
}

const welcome = (page: Page) => page.getByRole('heading', { name: 'Welcome' });
const emailInTopBar = (page: Page) => page.getByRole('banner').getByText(EMAIL);

test.describe('protected area (/app)', () => {
  test('redirects to /login without a session and sends no welcome content', async ({
    page,
    numoApi,
  }) => {
    const response = await page.request.get('/app', { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toMatch(/\/login$/);
    expect(await response.text()).not.toContain(WELCOME_TEXT);
    await page.goto('/app');
    await expect(page).toHaveURL('/login');
    expect(numoApi.calls).toEqual([]);
  });

  test('lands on /app after sign-in with the email in the top bar', async ({
    page,
    numoApi,
  }) => {
    const tokens = newTokens();
    numoApi.respond(LOGIN, issued(tokens, FRESH_SECONDS));
    numoApi.respond(CURRENT_USER, KNOWN_USER);

    await signIn(page);

    await expect(page).toHaveURL('/app');
    await expect(welcome(page)).toBeVisible();
    await expect(page.getByText(WELCOME_TEXT)).toBeVisible();
    await expect(emailInTopBar(page)).toBeVisible();
    expect(callsTo(numoApi, CURRENT_USER).at(-1)?.authorization).toBe(
      `Bearer ${tokens.accessToken}`,
    );
  });

  test('keeps the user signed in on reload', async ({ page, numoApi }) => {
    numoApi.respond(LOGIN, issued(newTokens(), FRESH_SECONDS));
    numoApi.respond(CURRENT_USER, KNOWN_USER);
    await signIn(page);
    await expect(welcome(page)).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL('/app');
    await expect(welcome(page)).toBeVisible();
    await expect(emailInTopBar(page)).toBeVisible();
    expect(callsTo(numoApi, REFRESH)).toEqual([]);
  });

  test('refreshes an expiring session exactly once and keeps the rotated tokens', async ({
    page,
    numoApi,
  }) => {
    const first = newTokens();
    const rotated = newTokens();
    numoApi.respond(LOGIN, issued(first, EXPIRING_SOON_SECONDS));
    numoApi.respond(REFRESH, issued(rotated, FRESH_SECONDS));
    numoApi.respond(CURRENT_USER, KNOWN_USER);
    await signIn(page);
    await expect(emailInTopBar(page)).toBeVisible();
    const sessionAfterRefresh = await sessionCookieValue(page);

    await page.reload();

    await expect(emailInTopBar(page)).toBeVisible();
    expect(callsTo(numoApi, REFRESH)).toEqual([
      {
        method: 'POST',
        path: '/auth/refresh',
        body: undefined,
        cookie: `refresh_token=${first.refreshToken}`,
      },
    ]);
    expect(callsTo(numoApi, CURRENT_USER).at(-1)?.authorization).toBe(
      `Bearer ${rotated.accessToken}`,
    );
    expect(await sessionCookieValue(page)).toBe(sessionAfterRefresh);
  });

  test('signs out to /login and deletes the session when numo-api refuses the refresh (401)', async ({
    page,
    numoApi,
  }) => {
    numoApi.respond(LOGIN, issued(newTokens(), EXPIRING_SOON_SECONDS));
    numoApi.respond(REFRESH, { status: 401 });

    await signIn(page);

    await expect.poll(() => callsTo(numoApi, REFRESH).length).toBe(1);
    await expect.poll(() => sessionCookieValue(page)).toBeUndefined();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
