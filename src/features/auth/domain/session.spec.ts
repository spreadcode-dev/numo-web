import {
  type IssuedTokens,
  isAccessTokenExpired,
  needsRefresh,
  type Session,
  startSession,
} from './session';

const NOW = new Date('2026-11-22T12:00:00.000Z');
const TOKENS: IssuedTokens = {
  accessToken: 'access-token',
  expiresInSeconds: 900,
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: new Date('2026-12-22T12:00:00.000Z'),
};

describe('startSession', () => {
  it('should expire the access token expiresIn seconds after now', () => {
    const session = startSession(TOKENS, NOW);

    expect(session.accessTokenExpiresAt).toEqual(
      new Date('2026-11-22T12:15:00.000Z'),
    );
  });

  it('should keep both tokens and the refresh token’s expiry', () => {
    const session = startSession(TOKENS, NOW);

    expect(session).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2026-12-22T12:00:00.000Z'),
    });
  });
});

const SESSION: Session = startSession(TOKENS, NOW);
const SECONDS = 1000;

function secondsAfterNow(seconds: number): Date {
  return new Date(NOW.getTime() + seconds * SECONDS);
}

function expiringAt(accessTokenExpiresAt: Date): Session {
  return { ...SESSION, accessTokenExpiresAt };
}

describe('isAccessTokenExpired', () => {
  it('should be false before the access token expires', () => {
    expect(isAccessTokenExpired(expiringAt(secondsAfterNow(1)), NOW)).toBe(
      false,
    );
  });

  it('should be true from the moment the access token expires', () => {
    expect(isAccessTokenExpired(expiringAt(NOW), NOW)).toBe(true);
  });
});

describe('needsRefresh', () => {
  it('should be false while the access token has more than 60 seconds left', () => {
    expect(needsRefresh(expiringAt(secondsAfterNow(61)), NOW)).toBe(false);
  });

  it('should be true when the access token expires within 60 seconds', () => {
    expect(needsRefresh(expiringAt(secondsAfterNow(60)), NOW)).toBe(true);
  });

  it('should be true when the access token has already expired', () => {
    expect(needsRefresh(expiringAt(secondsAfterNow(-1)), NOW)).toBe(true);
  });
});
