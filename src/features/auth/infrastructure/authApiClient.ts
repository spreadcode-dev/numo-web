import type { Credentials, SignInResult } from '@/features/auth/domain/signIn';

const SIGN_IN_URL = '/api/auth/login';
// numo-api's rate-limit window: the safe wait when Retry-After is missing or unreadable.
const DEFAULT_RETRY_AFTER_SECONDS = 60;

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;

const UNAVAILABLE: SignInResult = { kind: 'unavailable' };

export async function signIn(credentials: Credentials): Promise<SignInResult> {
  try {
    const response = await postCredentials(credentials);
    return await toSignInResult(response);
  } catch {
    return UNAVAILABLE;
  }
}

function postCredentials(credentials: Credentials): Promise<Response> {
  return fetch(SIGN_IN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
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
      return {
        kind: 'rateLimited',
        retryAfterSeconds: readRetryAfterSeconds(response),
      };
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

function readRetryAfterSeconds(response: Response): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isInteger(seconds) && seconds > 0
    ? seconds
    : DEFAULT_RETRY_AFTER_SECONDS;
}
