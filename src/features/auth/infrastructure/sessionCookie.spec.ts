// @vitest-environment node
import { cookies } from 'next/headers';
import type { Session } from '@/features/auth/domain/session';
import {
  deleteSession,
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  saveSession,
  readSession,
  sessionCookieOptions,
} from './sessionCookie';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

vi.mock('next/headers', () => ({ cookies: vi.fn<typeof cookies>() }));

const SECRET = 'a-test-only-session-secret-of-at-least-32-bytes';
const OTHER_SECRET = 'another-test-only-session-secret-of-32-bytes';
const CIPHERTEXT_PART = 3;
const SESSION: Session = {
  accessToken: 'access-token',
  accessTokenExpiresAt: new Date('2099-01-01T00:15:00.000Z'),
  refreshToken: 'refresh-token',
  refreshTokenExpiresAt: new Date('2099-01-31T00:00:00.000Z'),
};

// Changes one character of the encrypted part (JWE: header.key.iv.ciphertext.tag).
function tamper(token: string): string {
  return token
    .split('.')
    .map((part, index) =>
      index === CIPHERTEXT_PART ? flipFirstCharacter(part) : part,
    )
    .join('.');
}

function flipFirstCharacter(text: string): string {
  return `${text.startsWith('A') ? 'B' : 'A'}${text.slice(1)}`;
}

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('encryptSession and decryptSession', () => {
  it('should give back the same session after a round trip', async () => {
    const token = await encryptSession(SESSION);

    await expect(decryptSession(token)).resolves.toEqual(SESSION);
  });

  it('should not reveal the tokens in the cookie value', async () => {
    const token = await encryptSession(SESSION);

    expect(token).not.toContain(SESSION.accessToken);
    expect(token).not.toContain(SESSION.refreshToken);
  });

  it('should reject a tampered cookie', async () => {
    const token = await encryptSession(SESSION);

    await expect(decryptSession(tamper(token))).resolves.toBeUndefined();
  });

  it('should reject a cookie encrypted with another secret', async () => {
    const token = await encryptSession(SESSION);
    vi.stubEnv('SESSION_SECRET', OTHER_SECRET);

    await expect(decryptSession(token)).resolves.toBeUndefined();
  });

  it('should reject a session whose refresh token has expired', async () => {
    const token = await encryptSession({
      ...SESSION,
      refreshTokenExpiresAt: new Date('2000-01-01T00:00:00.000Z'),
    });

    await expect(decryptSession(token)).resolves.toBeUndefined();
  });

  it('should reject a value that is not an encrypted session', async () => {
    await expect(decryptSession('not-a-session')).resolves.toBeUndefined();
  });

  it.each([
    { secret: 'shorter-than-32-bytes', case: 'too short' },
    { secret: undefined, case: 'missing' },
  ])(
    'should refuse to encrypt when SESSION_SECRET is $case',
    async ({ secret }) => {
      vi.stubEnv('SESSION_SECRET', secret);

      await expect(encryptSession(SESSION)).rejects.toThrow('SESSION_SECRET');
    },
  );
});

describe('saveSession', () => {
  it('should set an HttpOnly, Secure, SameSite=Lax cookie that expires with the refresh token', async () => {
    const set = vi.fn<CookieStore['set']>();
    vi.mocked(cookies).mockResolvedValue({ set } as unknown as CookieStore);

    await saveSession(SESSION);

    expect(set).toHaveBeenCalledWith(SESSION_COOKIE, expect.any(String), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: SESSION.refreshTokenExpiresAt,
    });
  });
});

describe('deleteSession', () => {
  it('should delete the session cookie', async () => {
    const deleteCookie = vi.fn<CookieStore['delete']>();
    vi.mocked(cookies).mockResolvedValue({
      delete: deleteCookie,
    } as unknown as CookieStore);

    await deleteSession();

    expect(deleteCookie).toHaveBeenCalledWith(SESSION_COOKIE);
  });
});

describe('sessionCookieOptions', () => {
  it('should keep the session cookie flags and expire with the refresh token', () => {
    expect(sessionCookieOptions(SESSION)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: SESSION.refreshTokenExpiresAt,
    });
  });
});

describe('readSession', () => {
  function stubSessionCookie(value: string | undefined) {
    const get = vi
      .fn<CookieStore['get']>()
      .mockReturnValue(
        value === undefined ? undefined : { name: SESSION_COOKIE, value },
      );
    vi.mocked(cookies).mockResolvedValue({ get } as unknown as CookieStore);
    return get;
  }

  it('should read the session from the numo_session cookie', async () => {
    const get = stubSessionCookie(await encryptSession(SESSION));

    await expect(readSession()).resolves.toEqual(SESSION);
    expect(get).toHaveBeenCalledWith(SESSION_COOKIE);
  });

  it('should find no session without the cookie', async () => {
    stubSessionCookie(undefined);

    await expect(readSession()).resolves.toBeUndefined();
  });

  it('should find no session in a tampered cookie', async () => {
    stubSessionCookie(tamper(await encryptSession(SESSION)));

    await expect(readSession()).resolves.toBeUndefined();
  });
});
