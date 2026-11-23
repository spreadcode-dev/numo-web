import type { Metadata } from 'next';
import { requireSession } from '@/features/auth/infrastructure/currentSession';

export const metadata: Metadata = {
  title: 'Welcome · NuMo',
};

export default async function AppHomePage() {
  await requireSession();

  return (
    <main className="flex flex-col gap-2 px-6 py-10">
      <h1 className="text-3xl font-bold text-typography-900">Welcome</h1>
      <p className="text-base text-typography-700">
        Your accounts and expenses will show up here.
      </p>
    </main>
  );
}
