import { render, screen, within } from '@testing-library/react';
import { ThemeModeContext } from '@/features/shell/application/themeModeContext';
import { Topbar } from './Topbar';

describe('Topbar', () => {
  it('should show the logo and the dark theme switch in the page banner', () => {
    render(
      <ThemeModeContext
        value={{ theme: 'light', toggleTheme: vi.fn<() => void>() }}
      >
        <Topbar />
      </ThemeModeContext>,
    );

    const banner = within(screen.getByRole('banner'));
    expect(banner.getByText('NuMo')).toBeVisible();
    expect(
      banner.getByRole('switch', { name: 'Dark theme' }),
    ).toBeInTheDocument();
  });
});
