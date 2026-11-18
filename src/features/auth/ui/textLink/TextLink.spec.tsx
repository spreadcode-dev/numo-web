import { render, screen } from '@testing-library/react';
import { TextLink } from './TextLink';

describe('TextLink', () => {
  it('should link its text to the given page', () => {
    render(<TextLink href="/login">Sign in</TextLink>);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
