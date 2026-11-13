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
