import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  type ThemeMode,
  ThemeModeContext,
} from '@/features/shell/application/themeModeContext';
import { useThemeToggle } from './useThemeToggle';

function renderWithTheme(themeMode: ThemeMode) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeModeContext value={themeMode}>{children}</ThemeModeContext>
  );
  return renderHook(() => useThemeToggle(), { wrapper });
}

describe('useThemeToggle', () => {
  it.each([
    { theme: 'dark', isDark: true },
    { theme: 'light', isDark: false },
  ] as const)(
    'should report isDark $isDark for the $theme theme',
    ({ theme, isDark }) => {
      const { result } = renderWithTheme({
        theme,
        toggleTheme: vi.fn<() => void>(),
      });

      expect(result.current.isDark).toBe(isDark);
    },
  );

  it('should pass toggleTheme through from the context', () => {
    const toggleTheme = vi.fn<() => void>();
    const { result } = renderWithTheme({ theme: 'light', toggleTheme });

    result.current.toggleTheme();

    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
