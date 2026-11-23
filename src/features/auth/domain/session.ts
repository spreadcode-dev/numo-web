// Refreshing this early means a request never starts with a token that
// expires halfway through it.
const REFRESH_MARGIN_SECONDS = 60;
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

export function isAccessTokenExpired(session: Session, now: Date): boolean {
  return session.accessTokenExpiresAt.getTime() <= now.getTime();
}

export function needsRefresh(session: Session, now: Date): boolean {
  const refreshFrom =
    session.accessTokenExpiresAt.getTime() -
    REFRESH_MARGIN_SECONDS * MILLISECONDS_PER_SECOND;
  return refreshFrom <= now.getTime();
}

export type RefreshOutcome =
  | Readonly<{ kind: 'refreshed'; session: Session }>
  // numo-api refused the refresh token: expired, revoked or reused.
  | Readonly<{ kind: 'sessionEnded' }>
  | Readonly<{ kind: 'unavailable' }>;
