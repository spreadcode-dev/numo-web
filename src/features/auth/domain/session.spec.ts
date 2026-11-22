import { type IssuedTokens, startSession } from './session';

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
