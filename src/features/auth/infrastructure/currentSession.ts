import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { CurrentUser } from '@/features/auth/domain/currentUser';
import {
  isAccessTokenExpired,
  type Session,
} from '@/features/auth/domain/session';
import { fetchCurrentUser } from './authServerClient';
import { readSession } from './sessionCookie';

const SIGN_IN_PATH = '/login';

// For pages that need a signed-in user. It runs in the page, not a layout:
// layouts don't re-render on client navigation, pages do.
export const requireSession = cache(async (): Promise<Session> => {
  const session = await readUsableSession();
  if (session === undefined) redirect(SIGN_IN_PATH);
  return session;
});

// For UI that only adapts to a signed-in user: never redirects.
export const getCurrentUser = cache(
  async (): Promise<CurrentUser | undefined> => {
    const session = await readUsableSession();
    return session === undefined
      ? undefined
      : fetchCurrentUser(session.accessToken);
  },
);

// The proxy renews the access token before it expires on the routes it
// covers; anywhere else an expired one would be refused by numo-api.
async function readUsableSession(): Promise<Session | undefined> {
  const session = await readSession();
  return session === undefined || isAccessTokenExpired(session, new Date())
    ? undefined
    : session;
}
