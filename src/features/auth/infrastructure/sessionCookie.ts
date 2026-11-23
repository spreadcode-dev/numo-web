import 'server-only';
import { createHash } from 'node:crypto';
import { EncryptJWT, type JWTPayload, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';
import type { Session } from '@/features/auth/domain/session';

export const SESSION_COOKIE = 'numo_session';

const MINIMUM_SECRET_BYTES = 32;
const KEY_MANAGEMENT_ALGORITHM = 'dir';
const CONTENT_ENCRYPTION_ALGORITHM = 'A256GCM';

// HttpOnly: page scripts can't read it. Secure: sent only over HTTPS (browsers
// treat localhost as secure). Lax: links from other sites open signed in;
// Server Actions check the Origin themselves.
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const;

type SessionCookieOptions = typeof SESSION_COOKIE_OPTIONS &
  Readonly<{ expires: Date }>;

// Dates as epoch milliseconds: the encrypted payload is JSON.
type SessionClaims = Readonly<{
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}>;

export async function saveSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    await encryptSession(session),
    sessionCookieOptions(session),
  );
}

// The cookie lives as long as the refresh token: after that no request can
// renew the session anyway.
export function sessionCookieOptions(session: Session): SessionCookieOptions {
  return { ...SESSION_COOKIE_OPTIONS, expires: session.refreshTokenExpiresAt };
}

export async function readSession(): Promise<Session | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token === undefined ? undefined : decryptSession(token);
}

export async function encryptSession(session: Session): Promise<string> {
  const key = sessionKey();
  return new EncryptJWT(toClaims(session))
    .setProtectedHeader({
      alg: KEY_MANAGEMENT_ALGORITHM,
      enc: CONTENT_ENCRYPTION_ALGORITHM,
    })
    .setExpirationTime(session.refreshTokenExpiresAt)
    .encrypt(key);
}

// A tampered, forged, expired or foreign cookie is simply no session. A
// misconfigured SESSION_SECRET still throws: that's a server problem.
export async function decryptSession(
  token: string,
): Promise<Session | undefined> {
  const key = sessionKey();
  try {
    const { payload } = await jwtDecrypt(token, key, {
      keyManagementAlgorithms: [KEY_MANAGEMENT_ALGORITHM],
      contentEncryptionAlgorithms: [CONTENT_ENCRYPTION_ALGORITHM],
    });
    return toSession(payload);
  } catch {
    return undefined;
  }
}

// A256GCM needs a key of exactly 256 bits; SHA-256 derives one from the secret.
function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? '';
  if (Buffer.byteLength(secret) < MINIMUM_SECRET_BYTES) {
    throw new Error(
      `SESSION_SECRET must be at least ${MINIMUM_SECRET_BYTES} bytes (generate one with: openssl rand -base64 48)`,
    );
  }
  return createHash('sha256').update(secret).digest();
}

function toClaims(session: Session): SessionClaims {
  return {
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt.getTime(),
    refreshToken: session.refreshToken,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt.getTime(),
  };
}

function toSession(payload: JWTPayload): Session | undefined {
  if (!isSessionClaims(payload)) return undefined;
  return {
    accessToken: payload.accessToken,
    accessTokenExpiresAt: new Date(payload.accessTokenExpiresAt),
    refreshToken: payload.refreshToken,
    refreshTokenExpiresAt: new Date(payload.refreshTokenExpiresAt),
  };
}

function isSessionClaims(
  payload: JWTPayload,
): payload is JWTPayload & SessionClaims {
  return (
    typeof payload.accessToken === 'string' &&
    typeof payload.accessTokenExpiresAt === 'number' &&
    typeof payload.refreshToken === 'string' &&
    typeof payload.refreshTokenExpiresAt === 'number'
  );
}
