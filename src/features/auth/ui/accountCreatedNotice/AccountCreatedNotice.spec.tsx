import { render, screen } from '@testing-library/react';
import { AccountCreatedNotice } from './AccountCreatedNotice';

describe('AccountCreatedNotice', () => {
  it('should announce the new account politely, as a status', () => {
    render(<AccountCreatedNotice />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Account created. Sign in with your new email and password.',
    );
  });
});
