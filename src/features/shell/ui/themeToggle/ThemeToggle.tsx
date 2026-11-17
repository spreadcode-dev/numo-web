'use client';

import { Switch } from '@/components/ui/switch';
import { useThemeToggle } from './useThemeToggle';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeToggle();

  return (
    <Switch
      aria-label="Dark theme"
      value={isDark}
      onValueChange={toggleTheme}
    />
  );
}
