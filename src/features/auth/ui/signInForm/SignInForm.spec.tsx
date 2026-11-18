import { fireEvent, render, screen } from '@testing-library/react';
import { SignInForm } from './SignInForm';
import { useConnectedSignInForm } from './useConnectedSignInForm';

vi.mock('./useConnectedSignInForm');

type ConnectedSignInForm = ReturnType<typeof useConnectedSignInForm>;

function renderSignInForm(overrides: Partial<ConnectedSignInForm> = {}) {
  const form = mockConnectedSignInForm(overrides);
  render(<SignInForm />);
  return form;
}

function mockConnectedSignInForm(overrides: Partial<ConnectedSignInForm> = {}) {
  const form: ConnectedSignInForm = {
    email: '',
    setEmail: vi.fn<() => void>(),
    password: '',
    setPassword: vi.fn<() => void>(),
    isSending: false,
    errorMessage: undefined,
    submitLabel: 'Sign in',
    submit: vi.fn<() => undefined>(),
    ...overrides,
  };
  vi.mocked(useConnectedSignInForm).mockReturnValue(form);
  return form;
}

describe('SignInForm', () => {
  it('should show labelled email and password fields', () => {
    renderSignInForm();

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeVisible();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
  });

  it('should pass what is typed to the form', () => {
    const form = renderSignInForm();

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'ana@example.com' },
    });

    expect(form.setEmail).toHaveBeenCalledWith('ana@example.com');
  });

  it('should submit when the button is pressed', () => {
    const form = renderSignInForm();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(form.submit).toHaveBeenCalledOnce();
  });

  it('should disable the button while sending', () => {
    renderSignInForm({ isSending: true, submitLabel: 'Signing in…' });

    expect(screen.getByRole('button', { name: 'Signing in…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('should show no alert until something fails', () => {
    renderSignInForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show the account-created notice after a sign-up', () => {
    mockConnectedSignInForm();

    render(<SignInForm isAfterSignUp />);

    expect(screen.getByRole('status')).toHaveTextContent('Account created.');
  });

  it('should hide the account-created notice once sign-in fails', () => {
    mockConnectedSignInForm({ errorMessage: 'Invalid email or password.' });

    render(<SignInForm isAfterSignUp />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show the failure message in an alert', () => {
    renderSignInForm({ errorMessage: 'Invalid email or password.' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    );
  });
});
