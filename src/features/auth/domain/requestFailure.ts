export type RequestFailure =
  | Readonly<{ kind: 'rateLimited'; retryAfterSeconds: number }>
  | Readonly<{ kind: 'unavailable' }>;

export function requestFailureMessage(failure: RequestFailure): string {
  switch (failure.kind) {
    case 'rateLimited':
      return `Too many attempts. Try again in ${secondsLabel(failure.retryAfterSeconds)}.`;
    case 'unavailable':
      return 'Something went wrong. Try again.';
  }
}

function secondsLabel(seconds: number): string {
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}
