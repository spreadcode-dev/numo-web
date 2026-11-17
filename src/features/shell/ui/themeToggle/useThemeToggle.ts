import { useSyncExternalStore } from 'react';
import { useThemeModeContext } from '@/features/shell/application/themeModeContext';

const neverChanges = () => () => {};

// False on the server and while React attaches to the server HTML, true after:
// the server can't know the saved theme, so the switch must match its HTML first.
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

export function useThemeToggle() {
  const { theme, toggleTheme } = useThemeModeContext();
  const hasHydrated = useHasHydrated();

  return { isDark: hasHydrated && theme === 'dark', toggleTheme };
}
