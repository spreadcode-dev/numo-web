// Memory only, never Web Storage, where any script on the page could read it.
// A reload forgets it: the API's HttpOnly refresh cookie restores the session.
let accessToken: string | undefined;

export function saveAccessToken(token: string): void {
  accessToken = token;
}

export function readAccessToken(): string | undefined {
  return accessToken;
}
