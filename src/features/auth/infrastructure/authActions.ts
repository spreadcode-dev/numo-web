'use server';

import type { RegisterResult } from '@/features/auth/domain/registration';
import type { Credentials, SignInResult } from '@/features/auth/domain/signIn';
import { UNAVAILABLE } from './apiResponses';
import { register, signIn } from './authServerClient';
import { saveSession } from './sessionCookie';

export async function registerAction(
  credentials: Credentials,
): Promise<RegisterResult> {
  return register(credentials);
}

// The tokens stay on the server, in the encrypted session cookie: the browser
// only learns whether it signed in.
export async function signInAction(
  credentials: Credentials,
): Promise<SignInResult> {
  const outcome = await signIn(credentials);
  if (outcome.kind !== 'signedIn') return outcome;
  try {
    await saveSession(outcome.session);
    return { kind: 'signedIn' };
  } catch (error) {
    console.error(
      'Sign-in succeeded but the session could not be saved:',
      error,
    );
    return UNAVAILABLE;
  }
}
