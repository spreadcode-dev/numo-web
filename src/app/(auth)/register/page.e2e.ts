import type { Page, Route } from '@playwright/test';
import { expect, test } from '@/testing/e2eFixtures';

const REGISTER_API = '**/api/auth/register';
const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';

// Colors from the NuMo design canvas (boards "Sign up" and "Sign in · after sign-up").
const LIGHT = {
  page: 'rgb(246, 246, 246)',
  card: 'rgb(255, 255, 255)',
  fieldError: 'rgb(185, 28, 28)',
  successBanner: 'rgb(237, 252, 242)',
};
const DARK = { page: 'rgb(39, 38, 37)', card: 'rgb(18, 18, 18)' };

const registered = (route: Route) =>
  route.fulfill({ status: 201, json: { id: 'user-1', email: EMAIL } });

const failingWith =
  (status: number, headers: Record<string, string> = {}) =>
  (route: Route) =>
    route.fulfill({ status, headers });

const emailField = (page: Page) => page.getByRole('textbox', { name: 'Email' });
const passwordField = (page: Page) =>
  page.getByLabel('Password', { exact: true });
const confirmationField = (page: Page) => page.getByLabel('Confirm password');
const createAccountButton = (page: Page) =>
  page.getByRole('button', { name: 'Create account' });
// Scoped to <main>: Next.js adds its own hidden role="alert" route announcer.
const formAlert = (page: Page) => page.getByRole('main').getByRole('alert');

type TypedForm = Readonly<{ password: string; passwordConfirmation: string }>;

async function fillSignUpForm(
  page: Page,
  typed: TypedForm = { password: PASSWORD, passwordConfirmation: PASSWORD },
) {
  await page.goto('/register');
  await emailField(page).fill(EMAIL);
  await passwordField(page).fill(typed.password);
  await confirmationField(page).fill(typed.passwordConfirmation);
}

test.describe('sign-up page', () => {
  test('shows the sign-up card on the light background, without the top bar', async ({
    page,
  }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: 'Create account' }),
    ).toBeVisible();
    await expect(
      page.getByText('Create your account with an email and a password.'),
    ).toBeVisible();
    await expect(passwordField(page)).toHaveAccessibleDescription(
      'Use 12–128 characters.',
    );
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

  test('uses the dark theme colors', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/register');

    await expect(page.getByRole('main')).toHaveCSS(
      'background-color',
      DARK.page,
    );
    await expect(page.locator('main section')).toHaveCSS(
      'background-color',
      DARK.card,
    );
  });

  test('links to the sign-in page', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('link', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/login');
  });

  test('creates the account and lands on sign-in with the banner and the email filled in', async ({
    page,
  }) => {
    await page.route(REGISTER_API, registered);
    await fillSignUpForm(page);

    await createAccountButton(page).click();

    await expect(page).toHaveURL('/login?registered=1');
    const banner = page.getByRole('status');
    await expect(banner).toHaveText(
      'Account created. Sign in with your new email and password.',
    );
    await expect(banner.locator('> *')).toHaveCSS(
      'background-color',
      LIGHT.successBanner,
    );
    await expect(emailField(page)).toHaveValue(EMAIL);
  });

  test('disables the button and shows "Creating account…" while sending', async ({
    page,
  }) => {
    const apiAnswer = Promise.withResolvers<void>();
    await page.route(REGISTER_API, async (route) => {
      await apiAnswer.promise;
      await registered(route);
    });
    await fillSignUpForm(page);

    await createAccountButton(page).click();

    await expect(
      page.getByRole('button', { name: 'Creating account…' }),
    ).toBeDisabled();
    apiAnswer.resolve();
    await expect(page).toHaveURL('/login?registered=1');
  });

  test('shows the field errors without calling the API', async ({ page }) => {
    let apiCalls = 0;
    await page.route(REGISTER_API, async (route) => {
      apiCalls += 1;
      await registered(route);
    });
    await fillSignUpForm(page, {
      password: 'short',
      passwordConfirmation: 'shorter',
    });

    await createAccountButton(page).click();

    await expect(passwordField(page)).toHaveAccessibleDescription(
      'Use at least 12 characters.',
    );
    await expect(confirmationField(page)).toHaveAccessibleDescription(
      'Passwords don’t match.',
    );
    await expect(passwordField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(passwordField(page).locator('..')).toHaveCSS(
      'border-top-color',
      LIGHT.fieldError,
    );
    expect(apiCalls).toBe(0);
  });

  test('offers to sign in when the email is already registered', async ({
    page,
  }) => {
    await page.route(REGISTER_API, failingWith(409));
    await fillSignUpForm(page);

    await createAccountButton(page).click();

    await expect(emailField(page)).toHaveAccessibleDescription(
      /This email is already registered\./,
    );
    await expect(emailField(page)).toHaveAttribute('aria-invalid', 'true');
    await page.getByRole('link', { name: 'Sign in instead' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('shows the rate-limit banner on a 429', async ({ page }) => {
    await page.route(REGISTER_API, failingWith(429, { 'Retry-After': '42' }));
    await fillSignUpForm(page);

    await createAccountButton(page).click();

    await expect(formAlert(page)).toHaveText(
      'Too many attempts. Try again in 42 seconds.',
    );
    await expect(page).toHaveURL('/register');
  });
});
