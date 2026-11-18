import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('should be announced as the text NuMo, with the mark hidden from screen readers', () => {
    const { container } = render(<Logo size="topbar" />);

    expect(screen.getByText('NuMo')).toBeVisible();
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it.each([
    { size: 'topbar', markPx: '28' },
    { size: 'auth', markPx: '36' },
  ] as const)(
    'should draw a $markPx px mark at $size size',
    ({ size, markPx }) => {
      const { container } = render(<Logo size={size} />);

      const mark = container.querySelector('svg');
      expect(mark).toHaveAttribute('width', markPx);
      expect(mark).toHaveAttribute('height', markPx);
    },
  );
});
