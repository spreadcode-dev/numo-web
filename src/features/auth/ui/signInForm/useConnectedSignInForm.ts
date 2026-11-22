import { useRouter } from 'next/navigation';
import { readRegisteredEmail } from '@/features/auth/application/registeredEmailStore';
import {
  type SignIn,
  useSignInForm,
} from '@/features/auth/application/useSignInForm';
import { UNAVAILABLE } from '@/features/auth/infrastructure/apiResponses';
import { signInAction } from '@/features/auth/infrastructure/authActions';

const HOME_PATH = '/';

// A Server Action call rejects when the Next.js server can't be reached,
// while the form expects `signIn` to always resolve with a result.
const signInOnServer: SignIn = (credentials) =>
  signInAction(credentials).catch(() => UNAVAILABLE);

export function useConnectedSignInForm() {
  const router = useRouter();
  const form = useSignInForm({
    signIn: signInOnServer,
    onSignedIn: () => router.replace(HOME_PATH),
    initialEmail: readRegisteredEmail(),
  });

  return {
    ...form,
    submitLabel: form.isSending ? 'Signing in…' : 'Sign in',
    submit: () => void form.submit(),
  };
}
