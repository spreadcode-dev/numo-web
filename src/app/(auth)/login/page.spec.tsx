import { render, screen } from '@testing-library/react';
import SignInPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn<() => void>() }),
}));

async function renderSignInPage(searchParams: Record<string, string> = {}) {
  render(
    await SignInPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

describe('SignInPage', () => {
  it('should show the "Sign in" heading', async () => {
    await renderSignInPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeInTheDocument();
  });

  it('should show the sign-in form in the card', async () => {
    await renderSignInPage();

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Sign in' }),
    );
  });

  it('should link to the sign-up page', async () => {
    await renderSignInPage();

    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/register');
  });

  it('should confirm the new account when coming from sign-up', async () => {
    await renderSignInPage({ registered: '1' });

    expect(screen.getByRole('status')).toHaveTextContent('Account created.');
  });

  it('should show no confirmation on a plain visit', async () => {
    await renderSignInPage();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
