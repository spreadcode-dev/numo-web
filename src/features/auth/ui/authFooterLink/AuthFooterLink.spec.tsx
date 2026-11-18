import { render, screen } from '@testing-library/react';
import { AuthFooterLink } from './AuthFooterLink';

describe('AuthFooterLink', () => {
  it('should ask the question and link to the other page', () => {
    render(
      <AuthFooterLink
        question="Already have an account?"
        linkText="Sign in"
        href="/login"
      />,
    );

    expect(screen.getByText(/Already have an account\?/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
