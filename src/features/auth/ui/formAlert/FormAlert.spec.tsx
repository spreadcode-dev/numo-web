import { render, screen } from '@testing-library/react';
import { FormAlert } from './FormAlert';

describe('FormAlert', () => {
  it('should announce the message as an alert', () => {
    render(<FormAlert message="Invalid email or password." />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    );
  });

  it('should hide its icon from screen readers', () => {
    render(<FormAlert message="Invalid email or password." />);

    expect(screen.getByRole('alert').querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
