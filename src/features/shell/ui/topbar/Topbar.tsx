import { Logo } from '@/shared/ui/logo/Logo';
import { ThemeToggle } from '@/features/shell/ui/themeToggle/ThemeToggle';

type TopbarProps = Readonly<{ email?: string }>;

export function Topbar({ email }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-outline-200 bg-background-0 px-6">
      <Logo size="topbar" />
      <div className="flex items-center gap-4">
        {email !== undefined && (
          <p className="text-sm text-typography-700">{email}</p>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
