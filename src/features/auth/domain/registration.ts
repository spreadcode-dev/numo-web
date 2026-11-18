import { type RequestFailure, requestFailureMessage } from './requestFailure';

export const EMAIL_TAKEN_MESSAGE = 'This email is already registered.';

export type RegisterResult =
  | Readonly<{ kind: 'registered' }>
  | Readonly<{ kind: 'emailTaken' }>
  | Readonly<{ kind: 'rejected'; message: string }>
  | RequestFailure;

// The failures shown in the form's alert banner. A taken email is shown
// under the email field instead.
export type RegistrationAlert = Exclude<
  RegisterResult,
  { kind: 'registered' } | { kind: 'emailTaken' }
>;

export function registrationAlertMessage(alert: RegistrationAlert): string {
  return alert.kind === 'rejected'
    ? alert.message
    : requestFailureMessage(alert);
}
