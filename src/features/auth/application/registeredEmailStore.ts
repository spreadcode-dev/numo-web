// Carries the new account's email from /register to /login in memory only:
// in the URL, a crafted link could prefill someone else's form.
let registeredEmail: string | undefined;

export function rememberRegisteredEmail(email: string): void {
  registeredEmail = email;
}

export function readRegisteredEmail(): string | undefined {
  return registeredEmail;
}
