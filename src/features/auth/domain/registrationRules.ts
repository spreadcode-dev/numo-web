export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_LENGTH_HINT = `Use ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters.`;

// Loose on purpose, like numo-api's domain rule (text, one "@", text): the
// API's stricter check stays the authority and its 400 is still shown.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+$/;

export type RegistrationForm = Readonly<{
  email: string;
  password: string;
  passwordConfirmation: string;
}>;

export type RegistrationField = keyof RegistrationForm;

export type RegistrationErrors = Readonly<
  Partial<Record<RegistrationField, string>>
>;

export function findRegistrationErrors(
  form: RegistrationForm,
): RegistrationErrors {
  return {
    email: emailError(form.email),
    password: passwordError(form.password),
    passwordConfirmation: confirmationError(form),
  };
}

export function hasRegistrationErrors(errors: RegistrationErrors): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}

function emailError(email: string): string | undefined {
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
    return `Use at most ${EMAIL_MAX_LENGTH} characters.`;
  }
  return EMAIL_FORMAT.test(trimmedEmail)
    ? undefined
    : 'Enter a valid email address.';
}

function passwordError(password: string): string | undefined {
  const length = characterCount(password);
  if (length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return undefined;
}

function confirmationError({
  password,
  passwordConfirmation,
}: RegistrationForm): string | undefined {
  return password === passwordConfirmation
    ? undefined
    : 'Passwords don’t match.';
}

// Counts what a person sees as characters, like numo-api: an emoji is one.
function characterCount(text: string): number {
  return [...new Intl.Segmenter().segment(text)].length;
}
