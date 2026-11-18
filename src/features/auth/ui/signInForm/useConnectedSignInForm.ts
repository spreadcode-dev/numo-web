import { useRouter } from 'next/navigation';
import { useSignInForm } from '@/features/auth/application/useSignInForm';
import { signIn } from '@/features/auth/infrastructure/authApiClient';

const HOME_PATH = '/';

export function useConnectedSignInForm() {
  const router = useRouter();
  const form = useSignInForm({
    signIn,
    onSignedIn: () => router.replace(HOME_PATH),
  });

  return {
    ...form,
    submitLabel: form.isSending ? 'Signing in…' : 'Sign in',
    submit: () => void form.submit(),
  };
}
