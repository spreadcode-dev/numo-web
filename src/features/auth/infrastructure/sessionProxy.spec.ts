// @vitest-environment node
import { NextRequest } from 'next/server';
import type { RefreshOutcome, Session } from '@/features/auth/domain/session';
import { refreshSession } from './authServerClient';
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
} from './sessionCookie';
import { refreshSessionIfNeeded } from './sessionProxy';

vi.mock('./authServerClient');

const SECRET = 'a-test-only-session-secret-of-at-least-32-bytes';
const APP_URL = 'http://localhost:3001/app';
const NOW = new Date('2026-11-22T12:00:00.000Z');
const SECONDS = 1000;
const REFRESHED_SESSION: Session = {
  accessToken: 'new-access',
  accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
  refreshToken: 'new-refresh',
  refreshTokenExpiresAt: new Date('2026-11-29T12:00:00.000Z'),
};
const REFRESHED: RefreshOutcome = {
  kind: 'refreshed',
  session: REFRESHED_SESSION,
};

function sessionExpiringIn(seconds: number, refreshToken: string): Session {
  return {
    accessToken: 'old-access',
    accessTokenExpiresAt: new Date(NOW.getTime() + seconds * SECONDS),
    refreshToken,
    refreshTokenExpiresAt: new Date('2026-11-29T12:00:00.000Z'),
  };
}

async function requestWith(session: Session): Promise<NextRequest> {
  const request = new NextRequest(APP_URL);
  request.cookies.set(SESSION_COOKIE, await encryptSession(session));
  return request;
}

function passesThrough(response: Response): boolean {
  return response.headers.get('x-middleware-next') === '1';
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

describe('refreshSessionIfNeeded', () => {
  it('should let a request without a session through, for the page to redirect', async () => {
    const response = await refreshSessionIfNeeded(new NextRequest(APP_URL));

    expect(passesThrough(response)).toBe(true);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('should let a fresh access token through without refreshing', async () => {
    const request = await requestWith(sessionExpiringIn(61, 'fresh-refresh'));

    const response = await refreshSessionIfNeeded(request);

    expect(passesThrough(response)).toBe(true);
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('should refresh an access token that expires within 60 seconds', async () => {
    vi.mocked(refreshSession).mockResolvedValue(REFRESHED);
    const request = await requestWith(
      sessionExpiringIn(60, 'expiring-refresh'),
    );

    await refreshSessionIfNeeded(request);

    expect(refreshSession).toHaveBeenCalledWith('expiring-refresh');
  });

  it('should save the refreshed session in the browser’s cookie', async () => {
    vi.mocked(refreshSession).mockResolvedValue(REFRESHED);
    const request = await requestWith(sessionExpiringIn(30, 'refresh-to-save'));

    const response = await refreshSessionIfNeeded(request);

    const cookie = response.cookies.get(SESSION_COOKIE);
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, path: '/' });
    await expect(decryptSession(cookie?.value ?? '')).resolves.toEqual(
      REFRESHED_SESSION,
    );
  });

  it('should hand the refreshed session to the page rendered for this request', async () => {
    vi.mocked(refreshSession).mockResolvedValue(REFRESHED);
    const request = await requestWith(
      sessionExpiringIn(30, 'refresh-to-forward'),
    );

    const response = await refreshSessionIfNeeded(request);

    const newValue = response.cookies.get(SESSION_COOKIE)?.value;
    expect(passesThrough(response)).toBe(true);
    expect(response.headers.get('x-middleware-request-cookie')).toContain(
      `${SESSION_COOKIE}=${newValue}`,
    );
  });

  it('should refresh once for two concurrent requests with the same session', async () => {
    vi.mocked(refreshSession).mockResolvedValue(REFRESHED);
    const session = sessionExpiringIn(30, 'shared-refresh');

    await Promise.all([
      refreshSessionIfNeeded(await requestWith(session)),
      refreshSessionIfNeeded(await requestWith(session)),
    ]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('should delete the session and redirect to /login when numo-api ends it (401)', async () => {
    vi.mocked(refreshSession).mockResolvedValue({ kind: 'sessionEnded' });
    const request = await requestWith(sessionExpiringIn(30, 'revoked-refresh'));

    const response = await refreshSessionIfNeeded(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/login',
    );
    expect(response.cookies.get(SESSION_COOKIE)).toMatchObject({
      value: '',
      expires: new Date(0),
    });
  });

  it('should keep the session and let the request through when numo-api is unavailable', async () => {
    vi.mocked(refreshSession).mockResolvedValue({ kind: 'unavailable' });
    const request = await requestWith(
      sessionExpiringIn(30, 'unreachable-refresh'),
    );

    const response = await refreshSessionIfNeeded(request);

    expect(passesThrough(response)).toBe(true);
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });
});
