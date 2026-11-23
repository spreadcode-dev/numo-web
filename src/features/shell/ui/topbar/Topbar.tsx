import { Logo } from '@/shared/ui/logo/Logo';
import { ThemeToggle } from '@/features/shell/ui/themeToggle/ThemeToggle';
import { UserMenu } from '@/features/shell/ui/userMenu/UserMenu';

type TopbarProps = Readonly<{
  email?: string;
  onSignOut: () => Promise<void>;
}>;

export function Topbar({ email, onSignOut }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-outline-200 bg-background-0 px-6">
      <Logo size="topbar" />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {email !== undefined && (
          <UserMenu email={email} onSignOut={onSignOut} />
        )}
      </div>
    </header>
  );
}
