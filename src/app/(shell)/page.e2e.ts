import { expect, test } from '@/testing/e2eFixtures';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

test('home page loads and shows the NuMo heading', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'NuMo', exact: true }),
  ).toBeVisible();
});

test('home page shows the gluestack button styled by Tailwind', async ({
  page,
}) => {
  await page.goto('/');

  const button = page.getByRole('button', { name: 'Get started' });
  await expect(button).toBeVisible();
  // `bg-primary-500` only paints the button if NativeWind and Tailwind reached the page.
  await expect(button).not.toHaveCSS('background-color', TRANSPARENT);
});

// Colors from the NuMo design canvas (board "Top bar · user menu open" and
// the logo sheet's "On dark").
const LIGHT = {
  bar: 'rgb(255, 255, 255)',
  border: 'rgb(221, 220, 219)',
  wordmark: 'rgb(23, 23, 23)',
};
const DARK = { bar: 'rgb(18, 18, 18)', wordmark: 'rgb(254, 254, 255)' };

test.describe('top bar', () => {
  test('shows the logo and the theme switch in the light brand colors', async ({
    page,
  }) => {
    await page.goto('/');

    const banner = page.getByRole('banner');
    await expect(banner).toHaveCSS('height', '64px');
    await expect(banner).toHaveCSS('background-color', LIGHT.bar);
    await expect(banner).toHaveCSS('border-bottom-color', LIGHT.border);
    await expect(banner.getByText('NuMo')).toHaveCSS('color', LIGHT.wordmark);
    await expect(
      banner.getByRole('switch', { name: 'Dark theme' }),
    ).not.toBeChecked();
  });

  test('uses Plus Jakarta Sans, also inside gluestack components', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page
        .getByRole('button', { name: 'Get started' })
        .getByText('Get started'),
    ).toHaveCSS('font-family', /Plus Jakarta Sans/);
  });

  test('switches to dark and remembers it after a reload', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: 'Dark theme' });

    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      DARK.bar,
    );

    await page.reload();
    await expect(toggle).toBeChecked();
    await expect(page.getByRole('banner').getByText('NuMo')).toHaveCSS(
      'color',
      DARK.wordmark,
    );
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
      'dark',
    );
  });

  test('is dark from the first paint, before any app JavaScript runs', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    // An empty response, not an error, so the console stays clean: whatever
    // is dark now was done by the inline <head> script alone.
    await page.route('**/_next/static/**/*.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: '' }),
    );

    await page.reload();

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(page.getByRole('banner')).toHaveCSS(
      'background-color',
      DARK.bar,
    );
  });

  test('follows the OS theme when nothing was chosen', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await expect(
      page.getByRole('switch', { name: 'Dark theme' }),
    ).toBeChecked();
  });
});
