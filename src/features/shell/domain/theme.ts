export type Theme = 'light' | 'dark';

export function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export function resolveInitialTheme(
  storedTheme: string | undefined,
  systemTheme: Theme,
): Theme {
  return isTheme(storedTheme) ? storedTheme : systemTheme;
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
