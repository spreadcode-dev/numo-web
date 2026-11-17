import { THEME_STORAGE_KEY } from '@/features/shell/application/themeStorage';

// Runs before the first paint, so a saved dark theme is dark from the start.
// It's inlined with toString(), so it must not use anything outside its body:
// that's why it repeats resolveInitialTheme (domain/theme.ts) instead of
// importing it. ThemeScript.spec.ts checks both give the same answers.
export function applyInitialTheme(storageKey: string): void {
  try {
    const stored = localStorage.getItem(storageKey);
    const system = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const theme = stored === 'light' || stored === 'dark' ? stored : system;
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch {
    // Storage blocked (e.g. strict privacy mode): React starts in light.
  }
}

const inlineScript = `(${applyInitialTheme.toString()})(${JSON.stringify(THEME_STORAGE_KEY)})`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: inlineScript }} />;
}
