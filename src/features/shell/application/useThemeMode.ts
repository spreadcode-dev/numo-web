import { useCallback, useState } from 'react';
import { THEME_STORAGE_KEY } from '@/features/shell/application/themeStorage';
import { oppositeTheme, type Theme } from '@/features/shell/domain/theme';

// The anti-flash script (ThemeScript) has already put the right class on
// <html> before React starts, so React adopts it instead of deciding again.
function readThemeFromDocument(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useThemeMode() {
  const [theme, setTheme] = useState<Theme>(readThemeFromDocument);

  const toggleTheme = useCallback(() => {
    const nextTheme = oppositeTheme(theme);
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, [theme]);

  return { theme, toggleTheme };
}
