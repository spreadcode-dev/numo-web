'use client';

import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { SignOutIcon } from '@/features/shell/ui/signOutIcon/SignOutIcon';
import { useUserMenu } from './useUserMenu';

const SIGNED_IN_AS_KEY = 'signedInAs';
const SIGN_OUT_KEY = 'signOut';

// gluestack forwards `onAction` to react-aria's menu (mouse and keyboard
// alike) but leaves it out of its prop types.
type ActionProps = Readonly<{ onAction: () => void }>;

type UserMenuProps = Readonly<{
  email: string;
  onSignOut: () => Promise<void>;
}>;

// gluestack's Menu only holds items, so the "Signed in as" caption is a
// disabled one: arrow keys skip it and it can't be chosen.
export function UserMenu({ email, onSignOut }: UserMenuProps) {
  const { signOut } = useUserMenu(onSignOut);
  const actionProps: ActionProps = { onAction: signOut };

  return (
    // gluestack renders the menu as role="list" and labels it with the
    // trigger: our props come last, so they restore role="menu" and the
    // "Account" name from the design.
    <Menu
      role="menu"
      aria-label="Account"
      aria-labelledby={undefined}
      placement="bottom right"
      offset={8}
      disabledKeys={[SIGNED_IN_AS_KEY]}
      {...actionProps}
      className="w-60 rounded-lg border-outline-200 bg-background-0 p-1.5 shadow-soft-1"
      trigger={({ ...triggerProps }, { open }: { open: boolean }) => (
        <Button
          {...triggerProps}
          variant="outline"
          action="secondary"
          className="h-11 rounded-md border-outline-500 bg-background-50 px-3 data-[hover=true]:bg-background-100"
        >
          <ButtonText className="text-sm font-semibold text-typography-900">
            {email}
          </ButtonText>
          <ButtonIcon
            aria-hidden
            as={open ? ChevronUpIcon : ChevronDownIcon}
            className="text-typography-700"
          />
        </Button>
      )}
    >
      <MenuItem
        key={SIGNED_IN_AS_KEY}
        textValue={`Signed in as ${email}`}
        className="mb-1.5 min-w-0 flex-col items-start rounded-none border-b border-outline-100 px-2.5 pb-2.5 pt-2 data-[disabled=true]:opacity-100 data-[disabled=true]:web:cursor-default"
      >
        <MenuItemLabel size="xs" className="text-typography-600">
          Signed in as
        </MenuItemLabel>
        <MenuItemLabel size="sm" className="font-semibold text-typography-900">
          {email}
        </MenuItemLabel>
      </MenuItem>
      <MenuItem
        key={SIGN_OUT_KEY}
        textValue="Sign out"
        className="min-h-11 min-w-0 gap-2.5 rounded-md px-2.5 py-0"
      >
        <Icon aria-hidden as={SignOutIcon} className="text-typography-700" />
        <MenuItemLabel className="text-typography-900">Sign out</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
}
