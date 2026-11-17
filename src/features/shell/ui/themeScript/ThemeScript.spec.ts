import { THEME_STORAGE_KEY } from '@/features/shell/application/themeStorage';
import { resolveInitialTheme } from '@/features/shell/domain/theme';
import { applyInitialTheme } from './ThemeScript';

function prepareBrowser({
  stored,
  osPrefersDark,
}: {
  stored?: string;
  osPrefersDark: boolean;
}) {
  if (stored) localStorage.setItem(THEME_STORAGE_KEY, stored);
  vi.stubGlobal('matchMedia', () => ({ matches: osPrefersDark }));
}

describe('applyInitialTheme', () => {
  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    { stored: 'light', osPrefersDark: true },
    { stored: 'dark', osPrefersDark: false },
    { stored: undefined, osPrefersDark: true },
    { stored: undefined, osPrefersDark: false },
    { stored: 'blue', osPrefersDark: true },
  ])(
    'should agree with resolveInitialTheme when $stored is stored and the OS prefers dark: $osPrefersDark',
    ({ stored, osPrefersDark }) => {
      prepareBrowser({ stored, osPrefersDark });
      const expected = resolveInitialTheme(
        stored,
        osPrefersDark ? 'dark' : 'light',
      );

      applyInitialTheme(THEME_STORAGE_KEY);

      expect(document.documentElement).toHaveClass(expected);
      expect(document.documentElement.style.colorScheme).toBe(expected);
    },
  );

  it('should leave the page alone when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    applyInitialTheme(THEME_STORAGE_KEY);

    expect(document.documentElement.className).toBe('');
  });
});
