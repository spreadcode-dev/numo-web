import { postJson, rateLimited } from './apiResponses';

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

describe('postJson', () => {
  it('should post the body as JSON to the given URL', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(undefined, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await postJson('/somewhere', { email: 'ana@example.com' });

    expect(fetchMock).toHaveBeenCalledWith('/somewhere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email":"ana@example.com"}',
    });
  });
});

describe('rateLimited', () => {
  it('should read the wait from Retry-After', () => {
    expect(rateLimited(tooManyRequests('42'))).toEqual({
      kind: 'rateLimited',
      retryAfterSeconds: 42,
    });
  });

  it.each([undefined, 'soon', '0'])(
    'should wait 60 seconds when Retry-After is %s',
    (retryAfter) => {
      expect(rateLimited(tooManyRequests(retryAfter))).toEqual({
        kind: 'rateLimited',
        retryAfterSeconds: 60,
      });
    },
  );
});
