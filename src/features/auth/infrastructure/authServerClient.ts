import 'server-only';
import type { RegisterResult } from '@/features/auth/domain/registration';
import type { Credentials } from '@/features/auth/domain/signIn';
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_TOO_MANY_REQUESTS,
  postJson,
  rateLimited,
  UNAVAILABLE,
} from './apiResponses';

const DEFAULT_NUMO_API_URL = 'http://localhost:3000';
const REGISTER_PATH = '/auth/register';

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
