import { expect, test } from '@/testing/e2eFixtures';

// These run on a blank page instead of the app, so the deliberate errors below
// aren't echoed by the dev server's browser-log forwarding.
const BLANK_PAGE = '<h1>Fixture check</h1>';

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
