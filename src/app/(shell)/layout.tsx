import type { ReactNode } from 'react';
import { Topbar } from '@/features/shell/ui/topbar/Topbar';

export default function ShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Topbar />
      {children}
    </>
  );
}
