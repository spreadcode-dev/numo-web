import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useThemeModeContext } from '@/features/shell/application/themeModeContext';
import { ThemeModeProvider } from './ThemeModeProvider';

function ToggleProbe() {
  const { toggleTheme } = useThemeModeContext();
  return (
    <button type="button" onClick={toggleTheme}>
      Toggle
    </button>
  );
}

describe('ThemeModeProvider', () => {
  afterEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('should keep the dark theme the anti-flash script applied', () => {
    document.documentElement.classList.add('dark');

    render(<ThemeModeProvider>content</ThemeModeProvider>);

    expect(document.documentElement).toHaveClass('dark');
  });

  it('should put the dark class on <html> when the theme is toggled', async () => {
    render(
      <ThemeModeProvider>
        <ToggleProbe />
      </ThemeModeProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('light');
  });
});
