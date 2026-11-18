import { signInFailureMessage } from './signIn';

describe('signInFailureMessage', () => {
  it('should give the same message for any invalid credentials', () => {
    expect(signInFailureMessage({ kind: 'invalidCredentials' })).toBe(
      'Invalid email or password.',
    );
  });

  it('should tell how many seconds to wait when rate limited', () => {
    expect(
      signInFailureMessage({ kind: 'rateLimited', retryAfterSeconds: 42 }),
    ).toBe('Too many attempts. Try again in 42 seconds.');
  });

  it('should use the singular for a one-second wait', () => {
    expect(
      signInFailureMessage({ kind: 'rateLimited', retryAfterSeconds: 1 }),
    ).toBe('Too many attempts. Try again in 1 second.');
  });

  it('should give a generic message when the API is unavailable', () => {
    expect(signInFailureMessage({ kind: 'unavailable' })).toBe(
      'Something went wrong. Try again.',
    );
  });
});
