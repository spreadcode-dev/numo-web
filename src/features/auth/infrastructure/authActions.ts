'use server';

import type { RegisterResult } from '@/features/auth/domain/registration';
import type { Credentials, SignInResult } from '@/features/auth/domain/signIn';
import { redirect } from 'next/navigation';
import { UNAVAILABLE } from './apiResponses';
import { logOut, register, signIn } from './authServerClient';
import { deleteSession, readSession, saveSession } from './sessionCookie';

const SIGN_IN_PATH = '/login';

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

// The session cookie goes even when numo-api can't revoke the refresh token
// (logOut never throws): the browser never stays signed in after the user
// asked to leave. `redirect` throws by design, so it comes last.
export async function signOutAction(): Promise<void> {
  const session = await readSession();
  if (session !== undefined) await logOut(session.refreshToken);
  await deleteSession();
  redirect(SIGN_IN_PATH);
}
