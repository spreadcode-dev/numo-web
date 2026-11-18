import { Logo } from '@/shared/ui/logo/Logo';
import { ThemeToggle } from '@/features/shell/ui/themeToggle/ThemeToggle';

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-outline-200 bg-background-0 px-6">
      <Logo size="topbar" />
      <ThemeToggle />
    </header>
  );
}
