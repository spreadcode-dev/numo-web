import { act, renderHook } from '@testing-library/react';
import type { SignInResult } from '@/features/auth/domain/signIn';
import { readAccessToken } from './sessionStore';
import { type SignIn, useSignInForm } from './useSignInForm';

const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';

function renderSignInForm(signIn: SignIn) {
  const onSignedIn = vi.fn<() => void>();
  const { result } = renderHook(() => useSignInForm({ signIn, onSignedIn }));
  act(() => {
    result.current.setEmail(EMAIL);
    result.current.setPassword(PASSWORD);
  });
  return { result, onSignedIn };
}

function answering(result: SignInResult) {
  return vi.fn<SignIn>().mockResolvedValue(result);
}

describe('useSignInForm', () => {
  it('should send the typed credentials', async () => {
    const signIn = answering({ kind: 'signedIn', accessToken: 'token-123' });
    const { result } = renderSignInForm(signIn);

    await act(() => result.current.submit());

    expect(signIn).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
  });

  it('should keep the token in memory and report the sign-in on success', async () => {
    const { result, onSignedIn } = renderSignInForm(
      answering({ kind: 'signedIn', accessToken: 'token-123' }),
    );

    await act(() => result.current.submit());

    expect(readAccessToken()).toBe('token-123');
    expect(onSignedIn).toHaveBeenCalledOnce();
  });

  it('should stay sending after a success, while the next page loads', async () => {
    const { result } = renderSignInForm(
      answering({ kind: 'signedIn', accessToken: 'token-123' }),
    );

    await act(() => result.current.submit());

    expect(result.current.isSending).toBe(true);
  });

  it('should show the failure message and keep the typed email', async () => {
    const { result, onSignedIn } = renderSignInForm(
      answering({ kind: 'invalidCredentials' }),
    );

    await act(() => result.current.submit());

    expect(result.current.errorMessage).toBe('Invalid email or password.');
    expect(result.current.isSending).toBe(false);
    expect(result.current.email).toBe(EMAIL);
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it('should be sending, without the old error, while waiting for the answer', async () => {
    const pending = Promise.withResolvers<SignInResult>();
    const signIn = vi
      .fn<SignIn>()
      .mockResolvedValueOnce({ kind: 'unavailable' })
      .mockReturnValueOnce(pending.promise);
    const { result } = renderSignInForm(signIn);
    await act(() => result.current.submit());

    act(() => void result.current.submit());

    expect(result.current.isSending).toBe(true);
    expect(result.current.errorMessage).toBeUndefined();
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });

  it('should ignore a second submit while the first is on its way', async () => {
    const pending = Promise.withResolvers<SignInResult>();
    const signIn = vi.fn<SignIn>().mockReturnValue(pending.promise);
    const { result } = renderSignInForm(signIn);
    act(() => void result.current.submit());

    act(() => void result.current.submit());

    expect(signIn).toHaveBeenCalledOnce();
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });
});
