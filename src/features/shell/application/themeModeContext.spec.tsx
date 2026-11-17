import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeModeContext, useThemeModeContext } from './themeModeContext';

describe('useThemeModeContext', () => {
  it('should give the theme provided above it', () => {
    const themeMode = { theme: 'dark' as const, toggleTheme: () => {} };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeModeContext value={themeMode}>{children}</ThemeModeContext>
    );

    const { result } = renderHook(() => useThemeModeContext(), { wrapper });

    expect(result.current).toBe(themeMode);
  });

  it('should fail clearly when used outside the provider', () => {
    expect(() => renderHook(() => useThemeModeContext())).toThrow(
      'useThemeModeContext must be used inside <ThemeModeProvider>',
    );
  });
});
