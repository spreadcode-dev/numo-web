import { render, screen } from '@testing-library/react';
import SignUpPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn<() => void>() }),
}));

describe('SignUpPage', () => {
  it('should show the "Create account" heading', () => {
    render(<SignUpPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create account' }),
    ).toBeInTheDocument();
  });

  it('should show the sign-up form in the card', () => {
    render(<SignUpPage />);

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Create account' }),
    );
  });

  it('should link to the sign-in page', () => {
    render(<SignUpPage />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
