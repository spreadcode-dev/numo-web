import { render, screen } from '@testing-library/react';
import SignInPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn<() => void>() }),
}));

describe('SignInPage', () => {
  it('should show the "Sign in" heading', () => {
    render(<SignInPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeInTheDocument();
  });

  it('should show the sign-in form in the card', () => {
    render(<SignInPage />);

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Sign in' }),
    );
  });
});
