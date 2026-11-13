import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    const browserErrors = collectBrowserErrors(page);
    await use(page);
    expect(browserErrors, 'browser console errors').toEqual([]);
  },
});

export { expect };

function collectBrowserErrors(page: Page): string[] {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  return browserErrors;
}
