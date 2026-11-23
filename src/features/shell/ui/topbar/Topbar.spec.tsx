import { render, screen, within } from '@testing-library/react';
import { ThemeModeContext } from '@/features/shell/application/themeModeContext';
import { Topbar } from './Topbar';

function renderTopbar(email?: string) {
  render(
    <ThemeModeContext
      value={{ theme: 'light', toggleTheme: vi.fn<() => void>() }}
    >
      <Topbar
        email={email}
        onSignOut={vi.fn<() => Promise<void>>().mockResolvedValue()}
      />
    </ThemeModeContext>,
  );
  return within(screen.getByRole('banner'));
}

describe('Topbar', () => {
  it('should show the logo and the dark theme switch in the page banner', () => {
    const banner = renderTopbar();

    expect(banner.getByText('NuMo')).toBeVisible();
    expect(
      banner.getByRole('switch', { name: 'Dark theme' }),
    ).toBeInTheDocument();
  });

  it('should show the signed-in user’s menu, named by their email', () => {
    const banner = renderTopbar('ana@example.com');

    expect(
      banner.getByRole('button', { name: 'ana@example.com' }),
    ).toBeVisible();
  });

  it('should show no user menu when signed out', () => {
    const banner = renderTopbar();

    expect(banner.queryByText(/@/)).not.toBeInTheDocument();
  });
});
