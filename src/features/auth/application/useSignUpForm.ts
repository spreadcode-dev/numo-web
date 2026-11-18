import { useState } from 'react';
import {
  type RegisterResult,
  registrationAlertMessage,
} from '@/features/auth/domain/registration';
import {
  findRegistrationErrors,
  hasRegistrationErrors,
  type RegistrationErrors,
} from '@/features/auth/domain/registrationRules';
import type { Credentials } from '@/features/auth/domain/signIn';
import { rememberRegisteredEmail } from './registeredEmailStore';

export type Register = (credentials: Credentials) => Promise<RegisterResult>;

type RegisterFailure = Exclude<RegisterResult, { kind: 'registered' }>;

type SignUpFormOptions = Readonly<{
  register: Register;
  onRegistered: () => void;
}>;

const NO_ERRORS: RegistrationErrors = {};

export function useSignUpForm({ register, onRegistered }: SignUpFormOptions) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(NO_ERRORS);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | undefined>();

  async function submit(): Promise<void> {
    if (isSending) return;
    const errors = findRegistrationErrors({
      email,
      password,
      passwordConfirmation,
    });
    showOnly(errors);
    if (hasRegistrationErrors(errors)) return;
    await send();
  }

  function showOnly(errors: RegistrationErrors): void {
    setFieldErrors(errors);
    setIsEmailTaken(false);
    setAlertMessage(undefined);
  }

  async function send(): Promise<void> {
    setIsSending(true);
    const result = await register({ email, password });
    if (result.kind === 'registered') {
      rememberRegisteredEmail(email);
      onRegistered();
      return;
    }
    showFailure(result);
    setIsSending(false);
  }

  function showFailure(failure: RegisterFailure): void {
    if (failure.kind === 'emailTaken') {
      setIsEmailTaken(true);
      return;
    }
    setAlertMessage(registrationAlertMessage(failure));
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    isSending,
    fieldErrors,
    isEmailTaken,
    alertMessage,
    submit,
  };
}
