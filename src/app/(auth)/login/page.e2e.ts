import type { Page, Route } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';

const SIGN_IN_API = '**/api/auth/login';
const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';
const ACCESS_TOKEN = 'access-token-from-the-api';

// Colors from the NuMo design canvas (boards "Sign in · default" and "401").
const LIGHT = {
  page: 'rgb(246, 246, 246)',
  card: 'rgb(255, 255, 255)',
  alert: 'rgb(254, 241, 241)',
};
const DARK = { page: 'rgb(39, 38, 37)', card: 'rgb(18, 18, 18)' };

const signedIn = (route: Route) =>
  route.fulfill({
    json: { accessToken: ACCESS_TOKEN, tokenType: 'Bearer', expiresIn: 900 },
  });

const failingWith =
  (status: number, headers: Record<string, string> = {}) =>
  (route: Route) =>
    route.fulfill({ status, headers });

const emailField = (page: Page) => page.getByRole('textbox', { name: 'Email' });
const passwordField = (page: Page) =>
  page.getByLabel('Password', { exact: true });
// Scoped to <main>: Next.js adds its own hidden role="alert" route announcer.
const formAlert = (page: Page) => page.getByRole('main').getByRole('alert');

async function fillCredentials(page: Page, password: string) {
  await page.goto('/login');
  await emailField(page).fill(EMAIL);
  await passwordField(page).fill(password);
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

  test('signs in, goes home and keeps the token out of Web Storage', async ({
    page,
  }) => {
    await page.route(SIGN_IN_API, signedIn);
    await fillCredentials(page, PASSWORD);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
    const webStorage = await page.evaluate(() =>
      JSON.stringify([
        Object.entries(localStorage),
        Object.entries(sessionStorage),
      ]),
    );
    expect(webStorage).not.toContain(ACCESS_TOKEN);
  });

  test('disables the button and shows "Signing in…" while sending', async ({
    page,
  }) => {
    const apiAnswer = Promise.withResolvers<void>();
    await page.route(SIGN_IN_API, async (route) => {
      await apiAnswer.promise;
      await signedIn(route);
    });
    await fillCredentials(page, PASSWORD);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByRole('button', { name: 'Signing in…' }),
    ).toBeDisabled();
    apiAnswer.resolve();
    await expect(page).toHaveURL('/');
  });

  test('shows "Invalid email or password." on a 401 and keeps the email', async ({
    page,
  }) => {
    await page.route(SIGN_IN_API, failingWith(401));
    await fillCredentials(page, 'wrong-password');

    await passwordField(page).press('Enter');

    await expect(formAlert(page)).toHaveText('Invalid email or password.');
    await expect(formAlert(page)).toHaveCSS('background-color', LIGHT.alert);
    await expect(page).toHaveURL('/login');
    await expect(emailField(page)).toHaveValue(EMAIL);
  });

  for (const { failure, respond, message } of [
    {
      failure: '429',
      respond: failingWith(429, { 'Retry-After': '42' }),
      message: 'Too many attempts. Try again in 42 seconds.',
    },
    {
      failure: '500',
      respond: failingWith(500),
      message: 'Something went wrong. Try again.',
    },
    {
      failure: 'network error',
      respond: (route: Route) => route.abort(),
      message: 'Something went wrong. Try again.',
    },
  ]) {
    test(`shows "${message}" on a ${failure}`, async ({ page }) => {
      await page.route(SIGN_IN_API, respond);
      await fillCredentials(page, PASSWORD);

      await page.getByRole('button', { name: 'Sign in' }).click();

      await expect(formAlert(page)).toHaveText(message);
      await expect(page).toHaveURL('/login');
    });
  }
});
