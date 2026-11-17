'use client';

import type { ReactNode } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ThemeModeContext } from '@/features/shell/application/themeModeContext';
import { useThemeMode } from '@/features/shell/application/useThemeMode';

export function ThemeModeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const themeMode = useThemeMode();

  return (
    <ThemeModeContext value={themeMode}>
      <GluestackUIProvider mode={themeMode.theme}>
        {children}
      </GluestackUIProvider>
    </ThemeModeContext>
  );
}
