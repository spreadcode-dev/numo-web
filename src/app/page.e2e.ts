import { expect, test } from '@/testing/e2eFixtures';

test('home page loads and shows the NuMo heading', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'NuMo' })).toBeVisible();
});
