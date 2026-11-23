import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from './UserMenu';

const EMAIL = 'ana@example.com';

function renderUserMenu(onSignOut = vi.fn<() => Promise<void>>()) {
  render(<UserMenu email={EMAIL} onSignOut={onSignOut} />);
  return screen.getByRole('button', { name: EMAIL });
}

describe('UserMenu', () => {
  it('should show the email on a closed menu trigger', () => {
    const trigger = renderUserMenu();

    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should hide the decorative chevron from assistive technology', () => {
    const trigger = renderUserMenu();

    expect(within(trigger).queryByRole('img')).not.toBeInTheDocument();
  });

  it('should open the Account menu with the email and Sign out', async () => {
    const user = userEvent.setup();
    const trigger = renderUserMenu();

    await user.click(trigger);

    const menu = await screen.findByRole('menu', { name: 'Account' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menu).toHaveTextContent(`Signed in as${EMAIL}`);
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });

  it('should close when Escape is pressed', async () => {
    const user = userEvent.setup();
    const trigger = renderUserMenu();
    await user.click(trigger);
    await screen.findByRole('menu', { name: 'Account' });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should sign out when Sign out is chosen', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn<() => Promise<void>>().mockResolvedValue();
    await user.click(renderUserMenu(onSignOut));

    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
