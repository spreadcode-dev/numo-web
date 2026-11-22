import type { Credentials, SignInResult } from '@/features/auth/domain/signIn';
import {
  HTTP_BAD_REQUEST,
  HTTP_OK,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  postJson,
  rateLimited,
  UNAVAILABLE,
} from './apiResponses';

const SIGN_IN_URL = '/api/auth/login';

export async function signIn(credentials: Credentials): Promise<SignInResult> {
  try {
    const response = await postJson(SIGN_IN_URL, credentials);
    return await toSignInResult(response);
  } catch {
    return UNAVAILABLE;
  }
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
