import {
  register,
  signIn,
  fetchCurrentUser,
  refreshSession,
} from './authServerClient';

const CREDENTIALS = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
};

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const NOW = new Date('2026-11-22T12:00:00.000Z');
const REFRESH_TOKEN_EXPIRES = 'Tue, 22 Dec 2026 12:00:00 GMT';
const REFRESH_TOKEN_COOKIE = `refresh_token=refresh-123; Path=/auth; Expires=${REFRESH_TOKEN_EXPIRES}; HttpOnly; Secure; SameSite=Strict`;
const LOGIN_BODY = {
  accessToken: 'access-123',
  tokenType: 'Bearer',
  expiresIn: 900,
};

function loggedIn(
  body: unknown = LOGIN_BODY,
  setCookie: readonly string[] = [REFRESH_TOKEN_COOKIE],
): Response {
  const headers = new Headers();
  setCookie.forEach((line) => headers.append('Set-Cookie', line));
  return Response.json(body, { headers });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('register', () => {
  it('should post to the local numo-api when NUMO_API_URL is not set', async () => {
    vi.stubEnv('NUMO_API_URL', undefined);
    const fetchMock = stubFetch(new Response(undefined, { status: 201 }));

    await register(CREDENTIALS);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/register',
      expect.anything(),
    );
  });

  it('should post to NUMO_API_URL when it is set', async () => {
    vi.stubEnv('NUMO_API_URL', 'http://numo-api.test');
    const fetchMock = stubFetch(new Response(undefined, { status: 201 }));

    await register(CREDENTIALS);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://numo-api.test/auth/register',
      expect.anything(),
    );
  });

  it('should forward only the email and password as JSON', async () => {
    const fetchMock = stubFetch(new Response(undefined, { status: 201 }));
    const withExtraField = { ...CREDENTIALS, isAdmin: true };

    await register(withExtraField);

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
    });
  });

  it('should report registered on 201', async () => {
    stubFetch(Response.json({ id: 'user-1' }, { status: 201 }));

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'registered',
    });
  });

  it('should report a taken email on 409', async () => {
    stubFetch(new Response(undefined, { status: 409 }));

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'emailTaken',
    });
  });

  it('should keep the API’s message on 400', async () => {
    stubFetch(
      Response.json(
        { message: 'Password must be between 12 and 128 characters' },
        { status: 400 },
      ),
    );

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'rejected',
      message: 'Password must be between 12 and 128 characters',
    });
  });

  it('should join a list of validation messages on 400', async () => {
    stubFetch(
      Response.json(
        { message: ['email must be an email', 'password must be a string'] },
        { status: 400 },
      ),
    );

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'rejected',
      message: 'email must be an email. password must be a string',
    });
  });

  it.each([{}, { message: [] }, { message: 42 }])(
    'should report unavailable on a 400 without a readable message (%o)',
    async (body) => {
      stubFetch(Response.json(body, { status: 400 }));

      await expect(register(CREDENTIALS)).resolves.toEqual({
        kind: 'unavailable',
      });
    },
  );

  it('should read the wait from Retry-After on 429', async () => {
    stubFetch(
      new Response(undefined, {
        status: 429,
        headers: { 'Retry-After': '42' },
      }),
    );

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 42,
    });
  });

  it('should report unavailable on a server error', async () => {
    stubFetch(new Response(undefined, { status: 500 }));

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  it('should report unavailable when numo-api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(register(CREDENTIALS)).resolves.toEqual({
      kind: 'unavailable',
    });
  });
});

describe('signIn', () => {
  it('should post only the email and password to numo-api’s login route', async () => {
    vi.stubEnv('NUMO_API_URL', 'http://numo-api.test');
    const fetchMock = stubFetch(loggedIn());

    const withExtraField = { ...CREDENTIALS, isAdmin: true };

    await signIn(withExtraField);

    expect(fetchMock).toHaveBeenCalledWith('http://numo-api.test/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
    });
  });

  it('should start a session from the body’s access token and the refresh token cookie on 200', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    stubFetch(loggedIn());

    await expect(signIn(CREDENTIALS)).resolves.toEqual({
      kind: 'signedIn',
      session: {
        accessToken: 'access-123',
        accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
        refreshToken: 'refresh-123',
        refreshTokenExpiresAt: new Date(REFRESH_TOKEN_EXPIRES),
      },
    });
  });

  it('should report unavailable when a 200 sets no refresh token cookie', async () => {
    stubFetch(loggedIn(LOGIN_BODY, []));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });

  it.each([
    { tokenType: 'Bearer', expiresIn: 900 },
    { accessToken: 'access-123', tokenType: 'Bearer' },
    { accessToken: 'access-123', expiresIn: '900' },
    { accessToken: 'access-123', expiresIn: 0 },
  ])(
    'should report unavailable when a 200 body is incomplete (%o)',
    async (body) => {
      stubFetch(loggedIn(body));

      await expect(signIn(CREDENTIALS)).resolves.toEqual({
        kind: 'unavailable',
      });
    },
  );

  it.each([400, 401])(
    'should report invalid credentials on %i',
    async (status) => {
      stubFetch(new Response(undefined, { status }));

      await expect(signIn(CREDENTIALS)).resolves.toEqual({
        kind: 'invalidCredentials',
      });
    },
  );

  it('should read the wait from Retry-After on 429', async () => {
    stubFetch(
      new Response(undefined, {
        status: 429,
        headers: { 'Retry-After': '42' },
      }),
    );

    await expect(signIn(CREDENTIALS)).resolves.toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 42,
    });
  });

  it('should report unavailable on a server error', async () => {
    stubFetch(new Response(undefined, { status: 500 }));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });

  it('should report unavailable when numo-api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });
});

describe('refreshSession', () => {
  it('should post the refresh token as numo-api’s cookie to its refresh route', async () => {
    vi.stubEnv('NUMO_API_URL', 'http://numo-api.test');
    const fetchMock = stubFetch(loggedIn());

    await refreshSession('refresh-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://numo-api.test/auth/refresh',
      { method: 'POST', headers: { Cookie: 'refresh_token=refresh-123' } },
    );
  });

  it('should start a new session from the rotated tokens on 200', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    stubFetch(loggedIn());

    await expect(refreshSession('old-refresh')).resolves.toEqual({
      kind: 'refreshed',
      session: {
        accessToken: 'access-123',
        accessTokenExpiresAt: new Date('2026-11-22T12:15:00.000Z'),
        refreshToken: 'refresh-123',
        refreshTokenExpiresAt: new Date(REFRESH_TOKEN_EXPIRES),
      },
    });
  });

  it('should report the session ended on 401', async () => {
    stubFetch(new Response(undefined, { status: 401 }));

    await expect(refreshSession('old-refresh')).resolves.toEqual({
      kind: 'sessionEnded',
    });
  });

  it('should report unavailable when a 200 sets no refresh token cookie', async () => {
    stubFetch(loggedIn(LOGIN_BODY, []));

    await expect(refreshSession('old-refresh')).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  it('should report unavailable on a server error', async () => {
    stubFetch(new Response(undefined, { status: 500 }));

    await expect(refreshSession('old-refresh')).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  it('should report unavailable when numo-api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(refreshSession('old-refresh')).resolves.toEqual({
      kind: 'unavailable',
    });
  });
});

describe('fetchCurrentUser', () => {
  it('should ask numo-api who the access token belongs to', async () => {
    vi.stubEnv('NUMO_API_URL', 'http://numo-api.test');
    const fetchMock = stubFetch(Response.json({ email: 'ana@example.com' }));

    await fetchCurrentUser('access-123');

    expect(fetchMock).toHaveBeenCalledWith('http://numo-api.test/auth/me', {
      headers: { Authorization: 'Bearer access-123' },
    });
  });

  it('should keep only the email on 200', async () => {
    stubFetch(Response.json({ id: 'user-1', email: 'ana@example.com' }));

    await expect(fetchCurrentUser('access-123')).resolves.toEqual({
      email: 'ana@example.com',
    });
  });

  it.each([
    { case: 'a 401', response: () => new Response(undefined, { status: 401 }) },
    {
      case: 'a body without email',
      response: () => Response.json({ id: 'user-1' }),
    },
    {
      case: 'a non-string email',
      response: () => Response.json({ email: 42 }),
    },
  ])('should return undefined on $case', async ({ response }) => {
    stubFetch(response());

    await expect(fetchCurrentUser('access-123')).resolves.toBeUndefined();
  });

  it('should return undefined when numo-api is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')),
    );

    await expect(fetchCurrentUser('access-123')).resolves.toBeUndefined();
  });
});
