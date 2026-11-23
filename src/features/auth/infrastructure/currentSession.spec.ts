// @vitest-environment node
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from '@/features/auth/domain/session';
import { fetchCurrentUser } from './authServerClient';
import { getCurrentUser, requireSession } from './currentSession';
import { encryptSession, SESSION_COOKIE } from './sessionCookie';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

vi.mock('next/headers', () => ({ cookies: vi.fn<typeof cookies>() }));
// Like Next.js's own redirect(), it ends the render by throwing.
vi.mock('next/navigation', () => ({
  redirect: vi.fn<typeof redirect>(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));
vi.mock('./authServerClient');

const SECRET = 'a-test-only-session-secret-of-at-least-32-bytes';
const NOW = new Date('2026-11-22T12:00:00.000Z');
const SESSION: Session = {
  accessToken: 'access-123',
  accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
  refreshToken: 'refresh-123',
  refreshTokenExpiresAt: new Date('2026-11-29T12:00:00.000Z'),
};
const EXPIRED: Session = {
  ...SESSION,
  accessTokenExpiresAt: new Date('2026-11-22T11:59:00.000Z'),
};

async function signedInWith(session: Session): Promise<void> {
  stubSessionCookie(await encryptSession(session));
}

function stubSessionCookie(value: string | undefined): void {
  const get = vi
    .fn<CookieStore['get']>()
    .mockReturnValue(
      value === undefined ? undefined : { name: SESSION_COOKIE, value },
    );
  vi.mocked(cookies).mockResolvedValue({ get } as unknown as CookieStore);
}

// Overwrites the end of the JWE's authentication tag.
function tampered(token: string): string {
  return `${token.slice(0, -4)}AAAA`;
}

beforeEach(() => {
  vi.stubEnv('SESSION_SECRET', SECRET);
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('requireSession', () => {
  it('should return the session when it is valid', async () => {
    await signedInWith(SESSION);

    await expect(requireSession()).resolves.toEqual(SESSION);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('should redirect to /login without a session cookie', async () => {
    stubSessionCookie(undefined);

    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to /login with a tampered session cookie', async () => {
    stubSessionCookie(tampered(await encryptSession(SESSION)));

    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to /login when the access token has expired', async () => {
    await signedInWith(EXPIRED);

    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});

describe('getCurrentUser', () => {
  it('should ask numo-api for the user of the session’s access token', async () => {
    await signedInWith(SESSION);
    vi.mocked(fetchCurrentUser).mockResolvedValue({ email: 'ana@example.com' });

    await expect(getCurrentUser()).resolves.toEqual({
      email: 'ana@example.com',
    });
    expect(fetchCurrentUser).toHaveBeenCalledWith('access-123');
  });

  it('should find no user, without asking numo-api, when signed out', async () => {
    stubSessionCookie(undefined);

    await expect(getCurrentUser()).resolves.toBeUndefined();
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it('should find no user, without asking numo-api, when the access token has expired', async () => {
    await signedInWith(EXPIRED);

    await expect(getCurrentUser()).resolves.toBeUndefined();
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it('should never redirect', async () => {
    stubSessionCookie(undefined);

    await getCurrentUser();

    expect(redirect).not.toHaveBeenCalled();
  });
});
