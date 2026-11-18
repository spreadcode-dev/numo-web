import { requestFailureMessage } from './requestFailure';

describe('requestFailureMessage', () => {
  it('should tell how many seconds to wait when rate limited', () => {
    expect(
      requestFailureMessage({ kind: 'rateLimited', retryAfterSeconds: 42 }),
    ).toBe('Too many attempts. Try again in 42 seconds.');
  });

  it('should use the singular for a one-second wait', () => {
    expect(
      requestFailureMessage({ kind: 'rateLimited', retryAfterSeconds: 1 }),
    ).toBe('Too many attempts. Try again in 1 second.');
  });

  it('should give a generic message when the API is unavailable', () => {
    expect(requestFailureMessage({ kind: 'unavailable' })).toBe(
      'Something went wrong. Try again.',
    );
  });
});
