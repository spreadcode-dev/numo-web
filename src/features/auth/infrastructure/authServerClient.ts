import 'server-only';
import type { RegisterResult } from '@/features/auth/domain/registration';
import { type Session, startSession } from '@/features/auth/domain/session';
import type { Credentials, SignInFailure } from '@/features/auth/domain/signIn';
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_OK,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  postJson,
  rateLimited,
  UNAVAILABLE,
} from './apiResponses';
import { readRefreshToken } from './refreshTokenCookie';

const DEFAULT_NUMO_API_URL = 'http://localhost:3000';
const REGISTER_PATH = '/auth/register';
const LOGIN_PATH = '/auth/login';

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
  const accessToken = readAccessToken(await response.json());
  const refreshToken = readRefreshToken(response.headers.getSetCookie());
  if (accessToken === undefined || refreshToken === undefined) {
    return UNAVAILABLE;
  }
  const session = startSession(
    {
      accessToken: accessToken.value,
      expiresInSeconds: accessToken.expiresInSeconds,
      refreshToken: refreshToken.value,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    },
    new Date(),
  );
  return { kind: 'signedIn', session };
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
