import type { ComponentProps, ReactNode } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';

// @types/react-native predates the 'current-password' and 'new-password'
// tokens, but react-native-web passes autoComplete straight to the HTML
// attribute, where they're the standard values password managers look for.
type InputFieldAutoComplete = ComponentProps<typeof InputField>['autoComplete'];

// gluestack draws an invalid field with error-700 plus an inner ring; the
// design wants a plain 1px error-600 border.
const INPUT_CLASS =
  'rounded-md border-outline-500 data-[invalid=true]:border-error-600 data-[invalid=true]:web:ring-0';

type LabeledInputProps = Readonly<{
  id: string;
  label: string;
  placeholder: string;
  autoComplete: 'email' | 'current-password' | 'new-password';
  type?: 'password';
  hint?: ReactNode;
  error?: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
}>;

// gluestack gives every FormControl the same generated id and every
// InputField the aria-label "Input Field", so both are set explicitly; the
// FormControl's id gets a suffix so it can't clash with the input's. The
// message is a plain <p>: gluestack's helper components replace any id with
// the label's, which would break aria-describedby.
export function LabeledInput({
  id,
  label,
  autoComplete,
  hint,
  error,
  ...fieldProps
}: LabeledInputProps) {
  const isInvalid = error !== undefined;
  const message = error ?? hint;
  const messageId = `${id}-message`;

  return (
    <FormControl id={`${id}-field`} className="gap-1.5">
      <FormControlLabel className="mb-0">
        <FormControlLabelText className="text-sm font-semibold">
          {label}
        </FormControlLabelText>
      </FormControlLabel>
      <Input size="lg" isInvalid={isInvalid} className={INPUT_CLASS}>
        <InputField
          id={id}
          aria-label={label}
          aria-describedby={message === undefined ? undefined : messageId}
          autoComplete={autoComplete as InputFieldAutoComplete}
          autoCapitalize="none"
          className="text-base"
          {...fieldProps}
        />
      </Input>
      {message !== undefined && (
        <p
          id={messageId}
          className={
            isInvalid ? 'text-sm text-error-600' : 'text-sm text-typography-700'
          }
        >
          {message}
        </p>
      )}
    </FormControl>
  );
}
