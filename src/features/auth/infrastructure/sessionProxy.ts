import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { createRefreshSingleFlight } from '@/features/auth/application/refreshSingleFlight';
import { needsRefresh, type Session } from '@/features/auth/domain/session';
import { refreshSession } from './authServerClient';
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './sessionCookie';

const SIGN_IN_PATH = '/login';

// One per server process: every request presenting the same refresh token
// shares its refresh (see createRefreshSingleFlight).
const refreshSingleFlight = createRefreshSingleFlight({
  refresh: refreshSession,
  now: () => new Date(),
});

// Server Components can read cookies but not set them, so the session is
// renewed here, before the page renders.
export async function refreshSessionIfNeeded(
  request: NextRequest,
): Promise<NextResponse> {
  const session = await readRequestSession(request);
  if (session === undefined || !needsRefresh(session, new Date())) {
    return NextResponse.next();
  }
  const outcome = await refreshSingleFlight(session.refreshToken);
  switch (outcome.kind) {
    case 'refreshed':
      return continueWithSession(request, outcome.session);
    case 'sessionEnded':
      return signOut(request);
    case 'unavailable':
      return NextResponse.next();
  }
}

async function readRequestSession(
  request: NextRequest,
): Promise<Session | undefined> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token === undefined ? undefined : decryptSession(token);
}

// The new cookie also replaces the old one on the request, so the page
// rendered for this request already reads the new session.
async function continueWithSession(
  request: NextRequest,
  session: Session,
): Promise<NextResponse> {
  const value = await encryptSession(session);
  request.cookies.set(SESSION_COOKIE, value);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(SESSION_COOKIE, value, sessionCookieOptions(session));
  return response;
}

function signOut(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(SIGN_IN_PATH, request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
