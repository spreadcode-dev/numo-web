// Each test loads a fresh copy of the module, so the token one test saves
// can't leak into the next.
async function loadSessionStore() {
  vi.resetModules();
  return import('./sessionStore');
}

describe('sessionStore', () => {
  it('should hold no access token before a sign-in', async () => {
    const { readAccessToken } = await loadSessionStore();

    expect(readAccessToken()).toBeUndefined();
  });

  it('should return the access token it saved', async () => {
    const { saveAccessToken, readAccessToken } = await loadSessionStore();

    saveAccessToken('token-123');

    expect(readAccessToken()).toBe('token-123');
  });

  it('should keep the token out of Web Storage', async () => {
    const { saveAccessToken } = await loadSessionStore();

    saveAccessToken('token-123');

    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
