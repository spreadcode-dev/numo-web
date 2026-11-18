import {
  findRegistrationErrors,
  hasRegistrationErrors,
  PASSWORD_LENGTH_HINT,
  type RegistrationForm,
} from './registrationRules';

const EMAIL_DOMAIN = '@example.com';

const VALID_FORM: RegistrationForm = {
  email: 'ana@example.com',
  password: 'correct-horse-battery',
  passwordConfirmation: 'correct-horse-battery',
};

function withEmail(email: string): RegistrationForm {
  return { ...VALID_FORM, email };
}

function withPassword(password: string): RegistrationForm {
  return { ...VALID_FORM, password, passwordConfirmation: password };
}

function emailOfLength(length: number): string {
  return 'a'.repeat(length - EMAIL_DOMAIN.length) + EMAIL_DOMAIN;
}

describe('findRegistrationErrors', () => {
  it('should find no errors in a valid form', () => {
    const errors = findRegistrationErrors(VALID_FORM);

    expect(hasRegistrationErrors(errors)).toBe(false);
  });

  it.each([12, 128])('should accept a %i-character password', (length) => {
    const errors = findRegistrationErrors(withPassword('a'.repeat(length)));

    expect(errors.password).toBeUndefined();
  });

  it.each([
    { length: 11, message: 'Use at least 12 characters.' },
    { length: 129, message: 'Use at most 128 characters.' },
  ])('should reject a $length-character password', ({ length, message }) => {
    const errors = findRegistrationErrors(withPassword('a'.repeat(length)));

    expect(errors.password).toBe(message);
  });

  it('should count an emoji as one character', () => {
    const errors = findRegistrationErrors(withPassword('😀'.repeat(11)));

    expect(errors.password).toBe('Use at least 12 characters.');
  });

  it('should reject a confirmation that differs from the password', () => {
    const errors = findRegistrationErrors({
      ...VALID_FORM,
      passwordConfirmation: 'correct-horse-battery!',
    });

    expect(errors.passwordConfirmation).toBe('Passwords don’t match.');
  });

  it('should accept a 254-character email', () => {
    const errors = findRegistrationErrors(withEmail(emailOfLength(254)));

    expect(errors.email).toBeUndefined();
  });

  it('should reject a 255-character email', () => {
    const errors = findRegistrationErrors(withEmail(emailOfLength(255)));

    expect(errors.email).toBe('Use at most 254 characters.');
  });

  it.each(['', 'ana', 'ana@', '@example.com', 'ana smith@example.com'])(
    'should reject "%s" as an email',
    (email) => {
      const errors = findRegistrationErrors(withEmail(email));

      expect(errors.email).toBe('Enter a valid email address.');
    },
  );

  it('should ignore spaces around the email', () => {
    const errors = findRegistrationErrors(withEmail('  ana@example.com  '));

    expect(errors.email).toBeUndefined();
  });

  it('should report every invalid field at once', () => {
    const errors = findRegistrationErrors({
      email: VALID_FORM.email,
      password: 'short',
      passwordConfirmation: 'shorter',
    });

    expect(hasRegistrationErrors(errors)).toBe(true);
    expect(errors).toEqual({
      password: 'Use at least 12 characters.',
      passwordConfirmation: 'Passwords don’t match.',
    });
  });
});

describe('PASSWORD_LENGTH_HINT', () => {
  it('should state both password limits', () => {
    expect(PASSWORD_LENGTH_HINT).toBe('Use 12–128 characters.');
  });
});
