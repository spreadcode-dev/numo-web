import { fireEvent, render, screen } from '@testing-library/react';
import { SignUpForm } from './SignUpForm';
import { useConnectedSignUpForm } from './useConnectedSignUpForm';

vi.mock('./useConnectedSignUpForm');

type ConnectedSignUpForm = ReturnType<typeof useConnectedSignUpForm>;

function renderSignUpForm(overrides: Partial<ConnectedSignUpForm> = {}) {
  const form: ConnectedSignUpForm = {
    email: '',
    setEmail: vi.fn<() => void>(),
    password: '',
    setPassword: vi.fn<() => void>(),
    passwordConfirmation: '',
    setPasswordConfirmation: vi.fn<() => void>(),
    isSending: false,
    fieldErrors: {},
    isEmailTaken: false,
    alertMessage: undefined,
    submitLabel: 'Create account',
    submit: vi.fn<() => undefined>(),
    ...overrides,
  };
  vi.mocked(useConnectedSignUpForm).mockReturnValue(form);
  render(<SignUpForm />);
  return form;
}

describe('SignUpForm', () => {
  it('should show labelled email, password and confirmation fields', () => {
    renderSignUpForm();

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('should describe the password field with the length hint', () => {
    renderSignUpForm();

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'Use 12–128 characters.',
    );
  });

  it('should pass the typed confirmation to the form', () => {
    const form = renderSignUpForm();

    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'correct-horse-battery' },
    });

    expect(form.setPasswordConfirmation).toHaveBeenCalledWith(
      'correct-horse-battery',
    );
  });

  it('should submit when the button is pressed', () => {
    const form = renderSignUpForm();

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(form.submit).toHaveBeenCalledOnce();
  });

  it('should disable the button while sending', () => {
    renderSignUpForm({ isSending: true, submitLabel: 'Creating account…' });

    expect(
      screen.getByRole('button', { name: 'Creating account…' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show each field error under its field', () => {
    renderSignUpForm({
      fieldErrors: {
        password: 'Use at least 12 characters.',
        passwordConfirmation: 'Passwords don’t match.',
      },
    });

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'Use at least 12 characters.',
    );
    expect(
      screen.getByLabelText('Confirm password'),
    ).toHaveAccessibleDescription('Passwords don’t match.');
  });

  it('should offer to sign in when the email is taken', () => {
    renderSignUpForm({ isEmailTaken: true });

    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription(/This email is already registered\./);
    expect(
      screen.getByRole('link', { name: 'Sign in instead' }),
    ).toHaveAttribute('href', '/login');
  });

  it('should show no alert until a request fails', () => {
    renderSignUpForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show the failure message in an alert', () => {
    renderSignUpForm({
      alertMessage: 'Too many attempts. Try again in 42 seconds.',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in 42 seconds.',
    );
  });
});
