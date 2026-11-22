import { register } from './authServerClient';

const CREDENTIALS = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
};

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
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
