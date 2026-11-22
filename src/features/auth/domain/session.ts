const MILLISECONDS_PER_SECOND = 1000;

export type Session = Readonly<{
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}>;

// numo-api gives the access token's lifetime relative to the login
// (`expiresIn`), and the refresh token's as a date (its cookie's `Expires`).
export type IssuedTokens = Readonly<{
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}>;

export function startSession(tokens: IssuedTokens, now: Date): Session {
  return {
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: new Date(
      now.getTime() + tokens.expiresInSeconds * MILLISECONDS_PER_SECOND,
    ),
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
  };
}
