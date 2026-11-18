import { signIn } from './authApiClient';

const CREDENTIALS = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
};

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function tooManyRequests(retryAfter: string | undefined): Response {
  const headers = new Headers();
  if (retryAfter !== undefined) {
    headers.set('Retry-After', retryAfter);
  }
  return new Response(undefined, { status: 429, headers });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signIn', () => {
  it('should post the credentials as JSON to the proxied login route', async () => {
    const fetchMock = stubFetch(Response.json({ accessToken: 'token-123' }));

    await signIn(CREDENTIALS);

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
    });
  });

  it('should return the access token on 200', async () => {
    stubFetch(Response.json({ accessToken: 'token-123', tokenType: 'Bearer' }));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({
      kind: 'signedIn',
      accessToken: 'token-123',
    });
  });

  it('should report unavailable when a 200 carries no access token', async () => {
    stubFetch(Response.json({ tokenType: 'Bearer' }));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });

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
    stubFetch(tooManyRequests('42'));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 42,
    });
  });

  it.each([undefined, 'soon', '0'])(
    'should wait 60 seconds when Retry-After is %s',
    async (retryAfter) => {
      stubFetch(tooManyRequests(retryAfter));

      await expect(signIn(CREDENTIALS)).resolves.toEqual({
        kind: 'rateLimited',
        retryAfterSeconds: 60,
      });
    },
  );

  it('should report unavailable on a server error', async () => {
    stubFetch(new Response(undefined, { status: 500 }));

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });

  it('should report unavailable when the network fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(signIn(CREDENTIALS)).resolves.toEqual({ kind: 'unavailable' });
  });
});
