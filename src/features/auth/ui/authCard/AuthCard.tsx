import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/logo/Logo';

type AuthCardProps = Readonly<{
  title: string;
  tagline: string;
  children: ReactNode;
}>;

export function AuthCard({ title, tagline, children }: AuthCardProps) {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-background-50 px-4 py-16">
      <Logo size="auth" />
      <section className="flex w-full max-w-[420px] flex-col gap-6 rounded-xl border border-outline-200 bg-background-0 p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-typography-900">{title}</h1>
          <p className="text-base text-typography-700">{tagline}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
