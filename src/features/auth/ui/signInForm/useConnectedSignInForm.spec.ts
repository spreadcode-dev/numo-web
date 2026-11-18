import { act, renderHook } from '@testing-library/react';
import { rememberRegisteredEmail } from '@/features/auth/application/registeredEmailStore';
import type { SignInResult } from '@/features/auth/domain/signIn';
import { signIn } from '@/features/auth/infrastructure/authApiClient';
import { useConnectedSignInForm } from './useConnectedSignInForm';

const { replace } = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/features/auth/infrastructure/authApiClient');

describe('useConnectedSignInForm', () => {
  it('should start with the email remembered at sign-up', () => {
    rememberRegisteredEmail('ana@example.com');

    const { result } = renderHook(() => useConnectedSignInForm());

    expect(result.current.email).toBe('ana@example.com');
  });

  it('should go to the home page after signing in', async () => {
    vi.mocked(signIn).mockResolvedValue({
      kind: 'signedIn',
      accessToken: 'token-123',
    });
    const { result } = renderHook(() => useConnectedSignInForm());

    await act(async () => result.current.submit());

    expect(replace).toHaveBeenCalledWith('/');
  });

  it('should label the button "Sign in" until it is pressed', () => {
    const { result } = renderHook(() => useConnectedSignInForm());

    expect(result.current.submitLabel).toBe('Sign in');
  });

  it('should label the button "Signing in…" while sending', async () => {
    const pending = Promise.withResolvers<SignInResult>();
    vi.mocked(signIn).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useConnectedSignInForm());

    act(() => result.current.submit());

    expect(result.current.submitLabel).toBe('Signing in…');
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });
});
