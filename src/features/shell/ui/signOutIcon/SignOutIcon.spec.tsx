import { render } from '@testing-library/react';
import { Icon } from '@/components/ui/icon';
import { SignOutIcon } from './SignOutIcon';

describe('SignOutIcon', () => {
  it('should draw the design’s sign-out path in an 18 px grid', () => {
    const { container } = render(
      <Icon as={SignOutIcon} className="text-typography-700" />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 18 18');
    expect(svg?.querySelector('path')).toHaveAttribute(
      'd',
      expect.stringContaining('M12 5.5'),
    );
  });
});
