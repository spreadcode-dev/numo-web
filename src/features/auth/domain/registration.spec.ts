import { registrationAlertMessage } from './registration';

describe('registrationAlertMessage', () => {
  it('should show the API’s own message when it rejects the form', () => {
    expect(
      registrationAlertMessage({
        kind: 'rejected',
        message: 'email must be an email',
      }),
    ).toBe('email must be an email');
  });

  it('should use the sign-in wording when rate limited', () => {
    expect(
      registrationAlertMessage({ kind: 'rateLimited', retryAfterSeconds: 42 }),
    ).toBe('Too many attempts. Try again in 42 seconds.');
  });

  it('should give a generic message when the API is unavailable', () => {
    expect(registrationAlertMessage({ kind: 'unavailable' })).toBe(
      'Something went wrong. Try again.',
    );
  });
});
