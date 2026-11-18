// Each test loads a fresh copy of the module, so the email one test remembers
// can't leak into the next.
async function loadRegisteredEmailStore() {
  vi.resetModules();
  return import('./registeredEmailStore');
}

describe('registeredEmailStore', () => {
  it('should hold no email before a sign-up', async () => {
    const { readRegisteredEmail } = await loadRegisteredEmailStore();

    expect(readRegisteredEmail()).toBeUndefined();
  });

  it('should return the email it remembered', async () => {
    const { rememberRegisteredEmail, readRegisteredEmail } =
      await loadRegisteredEmailStore();

    rememberRegisteredEmail('ana@example.com');

    expect(readRegisteredEmail()).toBe('ana@example.com');
  });
});
