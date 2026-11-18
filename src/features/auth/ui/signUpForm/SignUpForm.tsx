'use client';

import { Button, ButtonText } from '@/components/ui/button';
import { EMAIL_TAKEN_MESSAGE } from '@/features/auth/domain/registration';
import { PASSWORD_LENGTH_HINT } from '@/features/auth/domain/registrationRules';
import { FormAlert } from '@/features/auth/ui/formAlert/FormAlert';
import { LabeledInput } from '@/features/auth/ui/labeledInput/LabeledInput';
import { TextLink } from '@/features/auth/ui/textLink/TextLink';
import { useConnectedSignUpForm } from './useConnectedSignUpForm';

const SIGN_IN_PATH = '/login';

export function SignUpForm() {
  const form = useConnectedSignUpForm();

  return (
    <>
      {form.alertMessage !== undefined && (
        <FormAlert message={form.alertMessage} />
      )}
      <div className="flex flex-col gap-5">
        <LabeledInput
          id="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={
            form.isEmailTaken ? <EmailTakenError /> : form.fieldErrors.email
          }
          value={form.email}
          onChangeText={form.setEmail}
          onSubmitEditing={form.submit}
        />
        <LabeledInput
          id="password"
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          type="password"
          hint={PASSWORD_LENGTH_HINT}
          error={form.fieldErrors.password}
          value={form.password}
          onChangeText={form.setPassword}
          onSubmitEditing={form.submit}
        />
        <LabeledInput
          id="passwordConfirmation"
          label="Confirm password"
          placeholder="Type the password again"
          autoComplete="new-password"
          type="password"
          error={form.fieldErrors.passwordConfirmation}
          value={form.passwordConfirmation}
          onChangeText={form.setPasswordConfirmation}
          onSubmitEditing={form.submit}
        />
        <Button
          size="lg"
          className="w-full"
          isDisabled={form.isSending}
          onPress={form.submit}
        >
          <ButtonText className="text-base">{form.submitLabel}</ButtonText>
        </Button>
      </div>
    </>
  );
}

function EmailTakenError() {
  return (
    <>
      {EMAIL_TAKEN_MESSAGE}{' '}
      <TextLink href={SIGN_IN_PATH}>Sign in instead</TextLink>
    </>
  );
}
