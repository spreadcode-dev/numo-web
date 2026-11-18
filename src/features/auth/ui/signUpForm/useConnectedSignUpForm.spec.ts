import { act, renderHook } from '@testing-library/react';
import type { RegisterResult } from '@/features/auth/domain/registration';
import { register } from '@/features/auth/infrastructure/authApiClient';
import { useConnectedSignUpForm } from './useConnectedSignUpForm';

const PASSWORD = 'correct-horse-battery';

const { replace } = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/features/auth/infrastructure/authApiClient');

function renderFilledSignUpForm() {
  const { result } = renderHook(() => useConnectedSignUpForm());
  act(() => {
    result.current.setEmail('ana@example.com');
    result.current.setPassword(PASSWORD);
    result.current.setPasswordConfirmation(PASSWORD);
  });
  return result;
}

describe('useConnectedSignUpForm', () => {
  it('should go to the sign-in page, flagged as after sign-up, once registered', async () => {
    vi.mocked(register).mockResolvedValue({ kind: 'registered' });
    const result = renderFilledSignUpForm();

    await act(async () => result.current.submit());

    expect(replace).toHaveBeenCalledWith('/login?registered=1');
  });

  it('should label the button "Create account" until it is pressed', () => {
    const { result } = renderHook(() => useConnectedSignUpForm());

    expect(result.current.submitLabel).toBe('Create account');
  });

  it('should label the button "Creating account…" while sending', async () => {
    const pending = Promise.withResolvers<RegisterResult>();
    vi.mocked(register).mockReturnValue(pending.promise);
    const result = renderFilledSignUpForm();

    act(() => result.current.submit());

    expect(result.current.submitLabel).toBe('Creating account…');
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });
});
