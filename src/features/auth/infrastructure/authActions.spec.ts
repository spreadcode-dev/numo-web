import type { Session } from '@/features/auth/domain/session';
import { registerAction, signInAction } from './authActions';
import { register, signIn } from './authServerClient';
import { saveSession } from './sessionCookie';

vi.mock('./authServerClient');
vi.mock('./sessionCookie');

const CREDENTIALS = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
};
const SESSION: Session = {
  accessToken: 'access-123',
  accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
  refreshToken: 'refresh-123',
  refreshTokenExpiresAt: new Date('2026-12-22T12:00:00.000Z'),
};

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe('registerAction', () => {
  it('should register through the server-only client and return its result', async () => {
    vi.mocked(register).mockResolvedValue({ kind: 'emailTaken' });

    const result = await registerAction(CREDENTIALS);

    expect(register).toHaveBeenCalledWith(CREDENTIALS);
    expect(result).toEqual({ kind: 'emailTaken' });
  });
});

describe('signInAction', () => {
  it('should save the session and tell the browser only that it signed in', async () => {
    vi.mocked(signIn).mockResolvedValue({ kind: 'signedIn', session: SESSION });

    const result = await signInAction(CREDENTIALS);

    expect(signIn).toHaveBeenCalledWith(CREDENTIALS);
    expect(saveSession).toHaveBeenCalledWith(SESSION);
    expect(result).toEqual({ kind: 'signedIn' });
  });

  it('should return the failure without saving a session', async () => {
    vi.mocked(signIn).mockResolvedValue({ kind: 'invalidCredentials' });

    const result = await signInAction(CREDENTIALS);

    expect(result).toEqual({ kind: 'invalidCredentials' });
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('should report unavailable and log why when the session cannot be saved', async () => {
    vi.mocked(signIn).mockResolvedValue({ kind: 'signedIn', session: SESSION });
    vi.mocked(saveSession).mockRejectedValue(
      new Error('SESSION_SECRET must be at least 32 bytes'),
    );
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await signInAction(CREDENTIALS);

    expect(result).toEqual({ kind: 'unavailable' });
    expect(consoleError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        message: expect.stringContaining('SESSION_SECRET'),
      }),
    );
  });
});
