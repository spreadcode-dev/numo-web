import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LabeledInput } from './LabeledInput';

type Messages = Readonly<{ hint?: ReactNode; error?: ReactNode }>;

function renderPasswordInput(messages: Messages = {}) {
  render(
    <LabeledInput
      id="password"
      label="Password"
      placeholder="Create a password"
      autoComplete="new-password"
      type="password"
      value=""
      onChangeText={vi.fn<(text: string) => void>()}
      onSubmitEditing={vi.fn<() => void>()}
      {...messages}
    />,
  );
  return screen.getByLabelText('Password');
}

describe('LabeledInput', () => {
  it('should label the field', () => {
    const field = renderPasswordInput();

    expect(field).toHaveAttribute('type', 'password');
  });

  it('should have no description without a hint or an error', () => {
    const field = renderPasswordInput();

    expect(field).not.toHaveAttribute('aria-describedby');
  });

  it('should describe the field with its hint', () => {
    const field = renderPasswordInput({ hint: 'Use 12–128 characters.' });

    expect(field).toHaveAccessibleDescription('Use 12–128 characters.');
    expect(field).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('should replace the hint with the error and mark the field invalid', () => {
    const field = renderPasswordInput({
      hint: 'Use 12–128 characters.',
      error: 'Use at least 12 characters.',
    });

    expect(field).toHaveAccessibleDescription('Use at least 12 characters.');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.queryByText('Use 12–128 characters.'),
    ).not.toBeInTheDocument();
  });
});
