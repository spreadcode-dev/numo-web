import type { Page, Response as PageResponse } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';
import type { MockReply, NumoApiMock } from '@/testing/numoApiMock';

const LOGIN = 'POST /auth/login';
const SESSION_COOKIE = 'numo_session';
const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';
const ACCESS_TOKEN = 'access-token-from-the-api';
const REFRESH_TOKEN = 'refresh-token-from-the-api';
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = 'Invalid email or password.';
const SOMETHING_WENT_WRONG = 'Something went wrong. Try again.';

// Colors from the NuMo design canvas (boards "Sign in · default" and "401").
const LIGHT = {
  page: 'rgb(246, 246, 246)',
  card: 'rgb(255, 255, 255)',
  alert: 'rgb(254, 241, 241)',
};
const DARK = { page: 'rgb(39, 38, 37)', card: 'rgb(18, 18, 18)' };

// numo-api's login reply, as documented in its README: the access token in
// the body, the refresh token in an HttpOnly cookie on Path=/auth.
const LOGGED_IN: MockReply = {
  status: 200,
  json: { accessToken: ACCESS_TOKEN, tokenType: 'Bearer', expiresIn: 900 },
  headers: {
    'Set-Cookie': `refresh_token=${REFRESH_TOKEN}; Path=/auth; Expires=${new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS).toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
  },
};

const emailField = (page: Page) => page.getByRole('textbox', { name: 'Email' });
const passwordField = (page: Page) =>
  page.getByLabel('Password', { exact: true });
const signInButton = (page: Page) =>
  page.getByRole('button', { name: 'Sign in' });
// Scoped to <main>: Next.js adds its own hidden role="alert" route announcer.
const formAlert = (page: Page) => page.getByRole('main').getByRole('alert');

async function fillCredentials(page: Page, password: string) {
  await page.goto('/login');
  await emailField(page).fill(EMAIL);
  await passwordField(page).fill(password);
}

async function sessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === SESSION_COOKIE);
}

// Headers and body of every response the page receives, read as they arrive.
function collectResponses(page: Page): Promise<string>[] {
  const responses: Promise<string>[] = [];
  page.on('response', (response) => responses.push(readResponse(response)));
  return responses;
}

async function readResponse(response: PageResponse): Promise<string> {
  const headers = JSON.stringify(await response.allHeaders());
  // Redirects and some streamed responses have no readable body.
  const body = await response.text().catch(() => '');
  return `${headers}\n${body}`;
}

test.describe('sign-in page', () => {
  test('shows the sign-in card on the light background, without the top bar', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(
      page.getByText('Track every expense, on your own machine.'),
    ).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveCSS(
      'background-color',
      LIGHT.page,
    );
    await expect(page.locator('main section')).toHaveCSS(
      'background-color',
      LIGHT.card,
    );
  });

  test('links to the sign-up page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Create an account' }).click();

    await expect(page).toHaveURL('/register');
  });

  test('has 44 px fields', async ({ page }) => {
    await page.goto('/login');

    // The visible box is the gluestack Input around the <input>.
    await expect(emailField(page).locator('..')).toHaveCSS('height', '44px');
    await expect(passwordField(page).locator('..')).toHaveCSS('height', '44px');
  });

  test('uses the dark theme colors', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/login');

    await expect(page.getByRole('main')).toHaveCSS(
      'background-color',
      DARK.page,
    );
    await expect(page.locator('main section')).toHaveCSS(
      'background-color',
      DARK.card,
    );
  });

  test('signs in through numo-api on the server and goes home', async ({
    page,
    numoApi,
  }) => {
    numoApi.respond(LOGIN, LOGGED_IN);
    await fillCredentials(page, PASSWORD);

    await signInButton(page).click();

    await expect(page).toHaveURL('/');
    expect(numoApi.calls).toEqual([
      {
        method: 'POST',
        path: '/auth/login',
        body: { email: EMAIL, password: PASSWORD },
      },
    ]);
  });

  test('keeps the session in an HttpOnly, Secure, SameSite=Lax cookie and no refresh_token cookie', async ({
    page,
    numoApi,
  }) => {
    numoApi.respond(LOGIN, LOGGED_IN);
    await fillCredentials(page, PASSWORD);

    await signInButton(page).click();

    await expect(page).toHaveURL('/');
    expect(await sessionCookie(page)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    const cookieNames = (await page.context().cookies()).map(
      (cookie) => cookie.name,
    );
    expect(cookieNames).not.toContain('refresh_token');
  });

  test('never sends a token to the browser', async ({ page, numoApi }) => {
    numoApi.respond(LOGIN, LOGGED_IN);
    const responses = collectResponses(page);
    await fillCredentials(page, PASSWORD);

    await signInButton(page).click();

    await expect(page).toHaveURL('/');
    const everythingReceived = (await Promise.all(responses)).join('\n');
    expect(everythingReceived).not.toContain(ACCESS_TOKEN);
    expect(everythingReceived).not.toContain(REFRESH_TOKEN);
  });

  test('disables the button and shows "Signing in…" while sending', async ({
    page,
    numoApi,
  }) => {
    const apiAnswer = Promise.withResolvers<void>();
    numoApi.respond(LOGIN, async () => {
      await apiAnswer.promise;
      return LOGGED_IN;
    });
    await fillCredentials(page, PASSWORD);

    await signInButton(page).click();

    await expect(
      page.getByRole('button', { name: 'Signing in…' }),
    ).toBeDisabled();
    apiAnswer.resolve();
    await expect(page).toHaveURL('/');
  });

  test(`shows "${INVALID_CREDENTIALS}" on a 401 and keeps the email`, async ({
    page,
    numoApi,
  }) => {
    numoApi.respond(LOGIN, { status: 401 });
    await fillCredentials(page, 'wrong-password');

    await passwordField(page).press('Enter');

    await expect(formAlert(page)).toHaveText(INVALID_CREDENTIALS);
    await expect(formAlert(page)).toHaveCSS('background-color', LIGHT.alert);
    await expect(page).toHaveURL('/login');
    await expect(emailField(page)).toHaveValue(EMAIL);
  });

  for (const { failure, arrange, message } of [
    {
      failure: 'a wrong password (401)',
      arrange: (numoApi: NumoApiMock) =>
        numoApi.respond(LOGIN, { status: 401 }),
      message: INVALID_CREDENTIALS,
    },
    {
      failure: 'a malformed email (400)',
      arrange: (numoApi: NumoApiMock) =>
        numoApi.respond(LOGIN, { status: 400 }),
      message: INVALID_CREDENTIALS,
    },
    {
      failure: 'the rate limit (429)',
      arrange: (numoApi: NumoApiMock) =>
        numoApi.respond(LOGIN, {
          status: 429,
          headers: { 'Retry-After': '42' },
        }),
      message: 'Too many attempts. Try again in 42 seconds.',
    },
    {
      failure: 'a server error (500)',
      arrange: (numoApi: NumoApiMock) =>
        numoApi.respond(LOGIN, { status: 500 }),
      message: SOMETHING_WENT_WRONG,
    },
    {
      failure: 'numo-api being down',
      arrange: (numoApi: NumoApiMock) => numoApi.goDown(LOGIN),
      message: SOMETHING_WENT_WRONG,
    },
    {
      failure: 'a login without a refresh token',
      arrange: (numoApi: NumoApiMock) =>
        numoApi.respond(LOGIN, { ...LOGGED_IN, headers: {} }),
      message: SOMETHING_WENT_WRONG,
    },
  ]) {
    test(`shows "${message}" and sets no session on ${failure}`, async ({
      page,
      numoApi,
    }) => {
      arrange(numoApi);
      await fillCredentials(page, PASSWORD);

      await signInButton(page).click();

      await expect(formAlert(page)).toHaveText(message);
      await expect(page).toHaveURL('/login');
      expect(await sessionCookie(page)).toBeUndefined();
    });
  }

  test('no longer forwards /api to numo-api', async ({ page, numoApi }) => {
    const response = await page.request.get('/api/auth/me');

    expect(response.status()).toBe(404);
    expect(numoApi.calls).toEqual([]);
  });
});
