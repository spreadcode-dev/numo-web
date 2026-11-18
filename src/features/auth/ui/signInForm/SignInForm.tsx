'use client';

import { Button, ButtonText } from '@/components/ui/button';
import { AccountCreatedNotice } from '@/features/auth/ui/accountCreatedNotice/AccountCreatedNotice';
import { FormAlert } from '@/features/auth/ui/formAlert/FormAlert';
import { LabeledInput } from '@/features/auth/ui/labeledInput/LabeledInput';
import { useConnectedSignInForm } from './useConnectedSignInForm';

type SignInFormProps = Readonly<{ isAfterSignUp?: boolean }>;

export function SignInForm({ isAfterSignUp = false }: SignInFormProps) {
  const form = useConnectedSignInForm();

  return (
    <>
      {form.errorMessage !== undefined && (
        <FormAlert message={form.errorMessage} />
      )}
      {isAfterSignUp && form.errorMessage === undefined && (
        <AccountCreatedNotice />
      )}
      <div className="flex flex-col gap-5">
        <LabeledInput
          id="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChangeText={form.setEmail}
          onSubmitEditing={form.submit}
        />
        <LabeledInput
          id="password"
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          type="password"
          value={form.password}
          onChangeText={form.setPassword}
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
