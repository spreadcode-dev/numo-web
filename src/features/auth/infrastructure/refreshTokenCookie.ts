const REFRESH_TOKEN_COOKIE = 'refresh_token';
const EXPIRES_ATTRIBUTE = 'expires';

export type IssuedRefreshToken = Readonly<{ value: string; expiresAt: Date }>;

// numo-api hands the refresh token to its caller as a cookie. The web server
// is that caller now: it keeps the value (exactly as sent, to send it back
// the same way) and its expiry, and never forwards the cookie to the browser.
export function readRefreshToken(
  setCookieHeaders: readonly string[],
): IssuedRefreshToken | undefined {
  const header = setCookieHeaders.find((line) =>
    line.startsWith(`${REFRESH_TOKEN_COOKIE}=`),
  );
  if (header === undefined) return undefined;
  const [nameAndValue, ...attributes] = header.split(';');
  const value = nameAndValue.slice(REFRESH_TOKEN_COOKIE.length + 1);
  const expiresAt = readExpires(attributes);
  return value === '' || expiresAt === undefined
    ? undefined
    : { value, expiresAt };
}

function readExpires(attributes: readonly string[]): Date | undefined {
  const expires = attributes
    .map((attribute) => attribute.trim())
    .find((attribute) =>
      attribute.toLowerCase().startsWith(`${EXPIRES_ATTRIBUTE}=`),
    );
  if (expires === undefined) return undefined;
  const expiresAt = new Date(expires.slice(EXPIRES_ATTRIBUTE.length + 1));
  return Number.isNaN(expiresAt.getTime()) ? undefined : expiresAt;
}
