import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type ThemeMode,
  ThemeModeContext,
} from '@/features/shell/application/themeModeContext';
import { ThemeToggle } from './ThemeToggle';

function renderToggle(themeMode: ThemeMode) {
  render(
    <ThemeModeContext value={themeMode}>
      <ThemeToggle />
    </ThemeModeContext>,
  );
  return screen.getByRole('switch', { name: 'Dark theme' });
}

describe('ThemeToggle', () => {
  it('should be on when the theme is dark', () => {
    const toggle = renderToggle({
      theme: 'dark',
      toggleTheme: vi.fn<() => void>(),
    });

    expect(toggle).toBeChecked();
  });

  it('should be off when the theme is light', () => {
    const toggle = renderToggle({
      theme: 'light',
      toggleTheme: vi.fn<() => void>(),
    });

    expect(toggle).not.toBeChecked();
  });

  it('should toggle the theme when clicked', async () => {
    const toggleTheme = vi.fn<() => void>();
    const toggle = renderToggle({ theme: 'light', toggleTheme });

    await userEvent.click(toggle);

    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
