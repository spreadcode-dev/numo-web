import 'server-only';
import type { RegisterResult } from '@/features/auth/domain/registration';
import type { CurrentUser } from '@/features/auth/domain/currentUser';
import {
  type RefreshOutcome,
  type Session,
  startSession,
} from '@/features/auth/domain/session';
import type { Credentials, SignInFailure } from '@/features/auth/domain/signIn';
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_NO_CONTENT,
  HTTP_OK,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  postJson,
  rateLimited,
  UNAVAILABLE,
} from './apiResponses';
import {
  readRefreshToken,
  refreshTokenCookieHeader,
} from './refreshTokenCookie';

const DEFAULT_NUMO_API_URL = 'http://localhost:3000';
const REGISTER_PATH = '/auth/register';
const LOGIN_PATH = '/auth/login';
const REFRESH_PATH = '/auth/refresh';
const CURRENT_USER_PATH = '/auth/me';
const LOGOUT_PATH = '/auth/logout';

const SESSION_ENDED: RefreshOutcome = { kind: 'sessionEnded' };
const REFRESH_UNAVAILABLE: RefreshOutcome = { kind: 'unavailable' };

// Stays on the server: the Server Action stores the session in a cookie and
// tells the browser only that it signed in.
export type SignInOutcome =
  Readonly<{ kind: 'signedIn'; session: Session }> | SignInFailure;

type IssuedAccessToken = Readonly<{ value: string; expiresInSeconds: number }>;

// The credentials come from a Server Action, so from the browser: only the
// two fields numo-api expects are forwarded.
export async function register({
  email,
  password,
}: Credentials): Promise<RegisterResult> {
  try {
    const response = await postJson(numoApiUrl(REGISTER_PATH), {
      email,
      password,
    });
    return await toRegisterResult(response);
  } catch {
    return UNAVAILABLE;
  }
}

function numoApiUrl(path: string): string {
  return `${process.env.NUMO_API_URL ?? DEFAULT_NUMO_API_URL}${path}`;
}

async function toRegisterResult(response: Response): Promise<RegisterResult> {
  switch (response.status) {
    case HTTP_CREATED:
      return { kind: 'registered' };
    case HTTP_BAD_REQUEST:
      return readRejected(response);
    case HTTP_CONFLICT:
      return { kind: 'emailTaken' };
    case HTTP_TOO_MANY_REQUESTS:
      return rateLimited(response);
    default:
      return UNAVAILABLE;
  }
}

async function readRejected(response: Response): Promise<RegisterResult> {
  const message = readErrorMessage(await response.json());
  return message === undefined ? UNAVAILABLE : { kind: 'rejected', message };
}

// NestJS sends one error as a string and class-validator's errors as an array.
function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return undefined;
  }
  const messages = [body.message].flat();
  const isReadable =
    messages.length > 0 &&
    messages.every((message) => typeof message === 'string');
  return isReadable ? messages.join('. ') : undefined;
}

export async function signIn({
  email,
  password,
}: Credentials): Promise<SignInOutcome> {
  try {
    const response = await postJson(numoApiUrl(LOGIN_PATH), {
      email,
      password,
    });
    return await toSignInOutcome(response);
  } catch {
    return UNAVAILABLE;
  }
}

async function toSignInOutcome(response: Response): Promise<SignInOutcome> {
  switch (response.status) {
    case HTTP_OK:
      return readSession(response);
    // numo-api answers 400 to a malformed email: to the user that's just
    // another wrong credential.
    case HTTP_BAD_REQUEST:
    case HTTP_UNAUTHORIZED:
      return { kind: 'invalidCredentials' };
    case HTTP_TOO_MANY_REQUESTS:
      return rateLimited(response);
    default:
      return UNAVAILABLE;
  }
}

async function readSession(response: Response): Promise<SignInOutcome> {
  const session = await readIssuedSession(response);
  return session === undefined ? UNAVAILABLE : { kind: 'signedIn', session };
}

// Login and refresh answer alike: the access token in the body, the refresh
// token in a cookie.
async function readIssuedSession(
  response: Response,
): Promise<Session | undefined> {
  const accessToken = readAccessToken(await response.json());
  const refreshToken = readRefreshToken(response.headers.getSetCookie());
  if (accessToken === undefined || refreshToken === undefined) {
    return undefined;
  }
  return startSession(
    {
      accessToken: accessToken.value,
      expiresInSeconds: accessToken.expiresInSeconds,
      refreshToken: refreshToken.value,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    },
    new Date(),
  );
}

function readAccessToken(body: unknown): IssuedAccessToken | undefined {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('accessToken' in body) ||
    !('expiresIn' in body)
  ) {
    return undefined;
  }
  const { accessToken, expiresIn } = body;
  return typeof accessToken === 'string' &&
    typeof expiresIn === 'number' &&
    expiresIn > 0
    ? { value: accessToken, expiresInSeconds: expiresIn }
    : undefined;
}

// The refresh token goes back as the cookie numo-api set: its route is
// authenticated by that cookie, not by a header.
export async function refreshSession(
  refreshToken: string,
): Promise<RefreshOutcome> {
  try {
    const response = await fetch(numoApiUrl(REFRESH_PATH), {
      method: 'POST',
      headers: { Cookie: refreshTokenCookieHeader(refreshToken) },
    });
    return await toRefreshOutcome(response);
  } catch {
    return REFRESH_UNAVAILABLE;
  }
}

async function toRefreshOutcome(response: Response): Promise<RefreshOutcome> {
  switch (response.status) {
    case HTTP_OK:
      return readRefreshedSession(response);
    case HTTP_UNAUTHORIZED:
      return SESSION_ENDED;
    default:
      return REFRESH_UNAVAILABLE;
  }
}

async function readRefreshedSession(
  response: Response,
): Promise<RefreshOutcome> {
  const session = await readIssuedSession(response);
  return session === undefined
    ? REFRESH_UNAVAILABLE
    : { kind: 'refreshed', session };
}

// Signing out never depends on numo-api: a failure here is only logged, and
// the caller deletes the session cookie either way. The refresh token then
// simply expires on its own.
export async function logOut(refreshToken: string): Promise<void> {
  try {
    const response = await fetch(numoApiUrl(LOGOUT_PATH), {
      method: 'POST',
      headers: { Cookie: refreshTokenCookieHeader(refreshToken) },
    });
    if (response.status !== HTTP_NO_CONTENT) {
      console.error(`numo-api answered ${response.status} to the logout`);
    }
  } catch (error) {
    console.error('numo-api could not be reached to log out:', error);
  }
}

export async function fetchCurrentUser(
  accessToken: string,
): Promise<CurrentUser | undefined> {
  try {
    const response = await fetch(numoApiUrl(CURRENT_USER_PATH), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.status === HTTP_OK
      ? readCurrentUser(await response.json())
      : undefined;
  } catch {
    return undefined;
  }
}

function readCurrentUser(body: unknown): CurrentUser | undefined {
  if (typeof body !== 'object' || body === null || !('email' in body)) {
    return undefined;
  }
  return typeof body.email === 'string' ? { email: body.email } : undefined;
}
