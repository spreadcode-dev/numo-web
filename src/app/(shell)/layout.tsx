import type { ReactNode } from 'react';
import { signOutAction } from '@/features/auth/infrastructure/authActions';
import { getCurrentUser } from '@/features/auth/infrastructure/currentSession';
import { Topbar } from '@/features/shell/ui/topbar/Topbar';

export default async function ShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <>
      <Topbar email={user?.email} onSignOut={signOutAction} />
      {children}
    </>
  );
}
