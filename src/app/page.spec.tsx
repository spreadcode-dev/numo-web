import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('should show the NuMo heading', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'NuMo' }),
    ).toBeInTheDocument();
  });
});
