import { render, screen } from '@testing-library/react';
import { requireSession } from '@/features/auth/infrastructure/currentSession';
import AppHomePage from './page';

vi.mock('@/features/auth/infrastructure/currentSession');

describe('AppHomePage', () => {
  it('should check the session before rendering', async () => {
    await AppHomePage();

    expect(requireSession).toHaveBeenCalled();
  });

  it('should welcome a signed-in user', async () => {
    render(await AppHomePage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeInTheDocument();
  });

  it('should render nothing when the session check redirects', async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(new Error('NEXT_REDIRECT'));

    await expect(AppHomePage()).rejects.toThrow('NEXT_REDIRECT');
  });
});
