import { act, renderHook } from '@testing-library/react';
import type { RegisterResult } from '@/features/auth/domain/registration';
import { registerAction } from '@/features/auth/infrastructure/authActions';
import { useConnectedSignUpForm } from './useConnectedSignUpForm';

const PASSWORD = 'correct-horse-battery';

const { replace } = vi.hoisted(() => ({
  replace: vi.fn<(href: string) => void>(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/features/auth/infrastructure/authActions');

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
    vi.mocked(registerAction).mockResolvedValue({ kind: 'registered' });
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
    vi.mocked(registerAction).mockReturnValue(pending.promise);
    const result = renderFilledSignUpForm();

    act(() => result.current.submit());

    expect(result.current.submitLabel).toBe('Creating account…');
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });

  it('should show the "Something went wrong" alert when the server can’t be reached', async () => {
    vi.mocked(registerAction).mockRejectedValue(
      new TypeError('Failed to fetch'),
    );
    const result = renderFilledSignUpForm();

    await act(async () => result.current.submit());

    expect(result.current.alertMessage).toBe(
      'Something went wrong. Try again.',
    );
    expect(result.current.submitLabel).toBe('Create account');
  });
});
