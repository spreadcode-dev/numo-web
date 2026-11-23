import {
  readRefreshToken,
  refreshTokenCookieHeader,
} from './refreshTokenCookie';

const EXPIRES = 'Tue, 22 Dec 2026 12:00:00 GMT';
// As numo-api (Express) writes it.
const REFRESH_TOKEN_COOKIE = `refresh_token=refresh-123; Path=/auth; Expires=${EXPIRES}; HttpOnly; Secure; SameSite=Strict`;

describe('readRefreshToken', () => {
  it('should read the value and expiry of numo-api’s refresh token cookie', () => {
    const refreshToken = readRefreshToken([REFRESH_TOKEN_COOKIE]);

    expect(refreshToken).toEqual({
      value: 'refresh-123',
      expiresAt: new Date(EXPIRES),
    });
  });

  it('should find the refresh token among other cookies', () => {
    const refreshToken = readRefreshToken([
      'theme=dark; Path=/',
      REFRESH_TOKEN_COOKIE,
    ]);

    expect(refreshToken?.value).toBe('refresh-123');
  });

  it.each([
    { setCookie: [], case: 'no cookie at all' },
    { setCookie: ['theme=dark; Path=/'], case: 'only other cookies' },
    {
      setCookie: [`refresh_token=; Path=/auth; Expires=${EXPIRES}`],
      case: 'an empty value',
    },
    { setCookie: ['refresh_token=refresh-123; Path=/auth'], case: 'no expiry' },
    {
      setCookie: ['refresh_token=refresh-123; Expires=someday'],
      case: 'an unreadable expiry',
    },
  ])('should find no refresh token with $case', ({ setCookie }) => {
    expect(readRefreshToken(setCookie)).toBeUndefined();
  });
});

describe('refreshTokenCookieHeader', () => {
  it('should name the value refresh_token, as numo-api expects', () => {
    expect(refreshTokenCookieHeader('refresh-123')).toBe(
      'refresh_token=refresh-123',
    );
  });
});
