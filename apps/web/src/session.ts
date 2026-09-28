const TOKEN_KEY = "orybit.admin.token";

export function readSessionToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function writeSessionToken(
  token: string
): void {
  sessionStorage.setItem(
    TOKEN_KEY,
    token
  );
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
