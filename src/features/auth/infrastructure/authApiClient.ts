import type { RegisterResult } from '@/features/auth/domain/registration';
import type { RequestFailure } from '@/features/auth/domain/requestFailure';
import type { Credentials, SignInResult } from '@/features/auth/domain/signIn';

const SIGN_IN_URL = '/api/auth/login';
const REGISTER_URL = '/api/auth/register';
// numo-api's rate-limit window: the safe wait when Retry-After is missing or unreadable.
const DEFAULT_RETRY_AFTER_SECONDS = 60;

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;
const HTTP_TOO_MANY_REQUESTS = 429;

const UNAVAILABLE: RequestFailure = { kind: 'unavailable' };

export async function signIn(credentials: Credentials): Promise<SignInResult> {
  try {
    const response = await postJson(SIGN_IN_URL, credentials);
    return await toSignInResult(response);
  } catch {
    return UNAVAILABLE;
  }
}

export async function register(
  credentials: Credentials,
): Promise<RegisterResult> {
  try {
    const response = await postJson(REGISTER_URL, credentials);
    return await toRegisterResult(response);
  } catch {
    return UNAVAILABLE;
  }
}

function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function toSignInResult(response: Response): Promise<SignInResult> {
  switch (response.status) {
    case HTTP_OK:
      return readSignedIn(response);
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

async function readSignedIn(response: Response): Promise<SignInResult> {
  const accessToken = readAccessToken(await response.json());
  return accessToken === undefined
    ? UNAVAILABLE
    : { kind: 'signedIn', accessToken };
}

function readAccessToken(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('accessToken' in body)) {
    return undefined;
  }
  return typeof body.accessToken === 'string' ? body.accessToken : undefined;
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

function rateLimited(response: Response): RequestFailure {
  return {
    kind: 'rateLimited',
    retryAfterSeconds: readRetryAfterSeconds(response),
  };
}

function readRetryAfterSeconds(response: Response): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isInteger(seconds) && seconds > 0
    ? seconds
    : DEFAULT_RETRY_AFTER_SECONDS;
}
