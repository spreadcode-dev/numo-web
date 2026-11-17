import { createContext, use } from 'react';
import type { Theme } from '@/features/shell/domain/theme';

export interface ThemeMode {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeModeContext = createContext<ThemeMode | undefined>(undefined);

export function useThemeModeContext(): ThemeMode {
  const themeMode = use(ThemeModeContext);
  if (!themeMode) {
    throw new Error(
      'useThemeModeContext must be used inside <ThemeModeProvider>',
    );
  }
  return themeMode;
}
