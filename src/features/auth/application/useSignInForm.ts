import { useState } from 'react';
import {
  type Credentials,
  type SignInResult,
  signInFailureMessage,
} from '@/features/auth/domain/signIn';
import { saveAccessToken } from './sessionStore';

export type SignIn = (credentials: Credentials) => Promise<SignInResult>;

type SignInFormOptions = Readonly<{
  signIn: SignIn;
  onSignedIn: () => void;
}>;

export function useSignInForm({ signIn, onSignedIn }: SignInFormOptions) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function submit(): Promise<void> {
    if (isSending) return;
    setIsSending(true);
    setErrorMessage(undefined);
    const result = await signIn({ email, password });
    if (result.kind === 'signedIn') {
      saveAccessToken(result.accessToken);
      onSignedIn();
      return;
    }
    setErrorMessage(signInFailureMessage(result));
    setIsSending(false);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSending,
    errorMessage,
    submit,
  };
}
