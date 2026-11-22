import { useRouter } from 'next/navigation';
import {
  type Register,
  useSignUpForm,
} from '@/features/auth/application/useSignUpForm';
import { UNAVAILABLE } from '@/features/auth/infrastructure/apiResponses';
import { registerAction } from '@/features/auth/infrastructure/authActions';

const SIGN_IN_AFTER_SIGN_UP_PATH = '/login?registered=1';

// A Server Action call rejects when the Next.js server can't be reached,
// while the form expects `register` to always resolve with a result.
const registerOnServer: Register = (credentials) =>
  registerAction(credentials).catch(() => UNAVAILABLE);

export function useConnectedSignUpForm() {
  const router = useRouter();
  const form = useSignUpForm({
    register: registerOnServer,
    onRegistered: () => router.replace(SIGN_IN_AFTER_SIGN_UP_PATH),
  });

  return {
    ...form,
    submitLabel: form.isSending ? 'Creating account…' : 'Create account',
    submit: () => void form.submit(),
  };
}
