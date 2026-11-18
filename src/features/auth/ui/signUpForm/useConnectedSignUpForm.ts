import { useRouter } from 'next/navigation';
import { useSignUpForm } from '@/features/auth/application/useSignUpForm';
import { register } from '@/features/auth/infrastructure/authApiClient';

const SIGN_IN_AFTER_SIGN_UP_PATH = '/login?registered=1';

export function useConnectedSignUpForm() {
  const router = useRouter();
  const form = useSignUpForm({
    register,
    onRegistered: () => router.replace(SIGN_IN_AFTER_SIGN_UP_PATH),
  });

  return {
    ...form,
    submitLabel: form.isSending ? 'Creating account…' : 'Create account',
    submit: () => void form.submit(),
  };
}
