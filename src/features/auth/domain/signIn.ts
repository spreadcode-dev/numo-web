import { type RequestFailure, requestFailureMessage } from './requestFailure';

export type Credentials = Readonly<{ email: string; password: string }>;

export type SignInResult =
  | Readonly<{ kind: 'signedIn' }>
  | Readonly<{ kind: 'invalidCredentials' }>
  | RequestFailure;

export type SignInFailure = Exclude<SignInResult, { kind: 'signedIn' }>;

export function signInFailureMessage(failure: SignInFailure): string {
  return failure.kind === 'invalidCredentials'
    ? 'Invalid email or password.'
    : requestFailureMessage(failure);
}
