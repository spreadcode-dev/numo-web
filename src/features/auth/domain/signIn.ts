export type Credentials = Readonly<{ email: string; password: string }>;

export type SignInResult =
  | Readonly<{ kind: 'signedIn'; accessToken: string }>
  | Readonly<{ kind: 'invalidCredentials' }>
  | Readonly<{ kind: 'rateLimited'; retryAfterSeconds: number }>
  | Readonly<{ kind: 'unavailable' }>;

export type SignInFailure = Exclude<SignInResult, { kind: 'signedIn' }>;

export function signInFailureMessage(failure: SignInFailure): string {
  switch (failure.kind) {
    case 'invalidCredentials':
      return 'Invalid email or password.';
    case 'rateLimited':
      return `Too many attempts. Try again in ${secondsLabel(failure.retryAfterSeconds)}.`;
    case 'unavailable':
      return 'Something went wrong. Try again.';
  }
}

function secondsLabel(seconds: number): string {
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}
