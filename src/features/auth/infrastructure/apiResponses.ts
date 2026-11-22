import type { RequestFailure } from '@/features/auth/domain/requestFailure';

// numo-api's rate-limit window: the safe wait when Retry-After is missing or unreadable.
const DEFAULT_RETRY_AFTER_SECONDS = 60;

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_CONFLICT = 409;
export const HTTP_TOO_MANY_REQUESTS = 429;

export const UNAVAILABLE: RequestFailure = { kind: 'unavailable' };

export function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function rateLimited(response: Response): RequestFailure {
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
