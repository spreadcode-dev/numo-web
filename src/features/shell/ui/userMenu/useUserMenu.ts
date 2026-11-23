import { useTransition } from 'react';

// The sign-out is a Server Action that ends in a redirect: running it in a
// transition lets Next.js navigate when it answers.
export function useUserMenu(onSignOut: () => Promise<void>) {
  const [, startTransition] = useTransition();

  return { signOut: () => startTransition(onSignOut) };
}
