'use client';

import type { ComponentProps } from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { FormAlert } from '@/features/auth/ui/formAlert/FormAlert';
import { useConnectedSignInForm } from './useConnectedSignInForm';

// @types/react-native predates the 'current-password' token, but
// react-native-web passes autoComplete straight to the HTML attribute,
// where it's the standard value password managers look for.
type InputFieldAutoComplete = ComponentProps<typeof InputField>['autoComplete'];

export function SignInForm() {
  const form = useConnectedSignInForm();

  return (
    <>
      {form.errorMessage !== undefined && (
        <FormAlert message={form.errorMessage} />
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

type LabeledInputProps = Readonly<{
  id: string;
  label: string;
  placeholder: string;
  autoComplete: 'email' | 'current-password';
  type?: 'password';
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
}>;

// gluestack gives every FormControl the same generated id and every
// InputField the aria-label "Input Field", so both are set explicitly.
function LabeledInput({
  id,
  label,
  autoComplete,
  ...fieldProps
}: LabeledInputProps) {
  return (
    <FormControl id={id} className="gap-1.5">
      <FormControlLabel className="mb-0">
        <FormControlLabelText className="text-sm font-semibold">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Input size="lg" className="rounded-md border-outline-500">
        <InputField
          id={id}
          aria-label={label}
          autoComplete={autoComplete as InputFieldAutoComplete}
          autoCapitalize="none"
          className="text-base"
          {...fieldProps}
        />
      </Input>
    </FormControl>
  );
}
