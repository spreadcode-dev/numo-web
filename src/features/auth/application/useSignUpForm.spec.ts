import { act, renderHook } from '@testing-library/react';
import type { RegisterResult } from '@/features/auth/domain/registration';
import { readRegisteredEmail } from './registeredEmailStore';
import { type Register, useSignUpForm } from './useSignUpForm';

const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-horse-battery';

type TypedForm = Readonly<{
  email: string;
  password: string;
  passwordConfirmation: string;
}>;

const VALID_FORM: TypedForm = {
  email: EMAIL,
  password: PASSWORD,
  passwordConfirmation: PASSWORD,
};

function renderSignUpForm(register: Register, typed: TypedForm = VALID_FORM) {
  const onRegistered = vi.fn<() => void>();
  const { result } = renderHook(() =>
    useSignUpForm({ register, onRegistered }),
  );
  act(() => {
    result.current.setEmail(typed.email);
    result.current.setPassword(typed.password);
    result.current.setPasswordConfirmation(typed.passwordConfirmation);
  });
  return { result, onRegistered };
}

function answering(result: RegisterResult) {
  return vi.fn<Register>().mockResolvedValue(result);
}

describe('useSignUpForm', () => {
  it('should send only the email and password', async () => {
    const register = answering({ kind: 'registered' });
    const { result } = renderSignUpForm(register);

    await act(() => result.current.submit());

    expect(register).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD });
  });

  it('should show the field errors without calling the API', async () => {
    const register = answering({ kind: 'registered' });
    const { result } = renderSignUpForm(register, {
      email: EMAIL,
      password: 'short',
      passwordConfirmation: 'shorter',
    });

    await act(() => result.current.submit());

    expect(register).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({
      password: 'Use at least 12 characters.',
      passwordConfirmation: 'Passwords don’t match.',
    });
    expect(result.current.isSending).toBe(false);
  });

  it('should remember the email and report the sign-up on success', async () => {
    const { result, onRegistered } = renderSignUpForm(
      answering({ kind: 'registered' }),
    );

    await act(() => result.current.submit());

    expect(readRegisteredEmail()).toBe(EMAIL);
    expect(onRegistered).toHaveBeenCalledOnce();
  });

  it('should stay sending after a success, while the next page loads', async () => {
    const { result } = renderSignUpForm(answering({ kind: 'registered' }));

    await act(() => result.current.submit());

    expect(result.current.isSending).toBe(true);
  });

  it('should flag the email field when the email is taken', async () => {
    const { result, onRegistered } = renderSignUpForm(
      answering({ kind: 'emailTaken' }),
    );

    await act(() => result.current.submit());

    expect(result.current.isEmailTaken).toBe(true);
    expect(result.current.alertMessage).toBeUndefined();
    expect(result.current.isSending).toBe(false);
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('should show the banner message on any other failure', async () => {
    const { result } = renderSignUpForm(
      answering({ kind: 'rateLimited', retryAfterSeconds: 42 }),
    );

    await act(() => result.current.submit());

    expect(result.current.alertMessage).toBe(
      'Too many attempts. Try again in 42 seconds.',
    );
    expect(result.current.isEmailTaken).toBe(false);
    expect(result.current.isSending).toBe(false);
  });

  it('should clear the old feedback on the next submit', async () => {
    const register = vi
      .fn<Register>()
      .mockResolvedValueOnce({ kind: 'emailTaken' })
      .mockResolvedValueOnce({ kind: 'unavailable' });
    const { result } = renderSignUpForm(register);
    await act(() => result.current.submit());

    await act(() => result.current.submit());

    expect(result.current.isEmailTaken).toBe(false);
    expect(result.current.alertMessage).toBe(
      'Something went wrong. Try again.',
    );
  });

  it('should ignore a second submit while the first is on its way', async () => {
    const pending = Promise.withResolvers<RegisterResult>();
    const register = vi.fn<Register>().mockReturnValue(pending.promise);
    const { result } = renderSignUpForm(register);
    act(() => void result.current.submit());

    act(() => void result.current.submit());

    expect(register).toHaveBeenCalledOnce();
    await act(async () => pending.resolve({ kind: 'unavailable' }));
  });
});
