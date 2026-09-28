const TOKEN_KEY = "orybit.admin.token";
export const SESSION_CHANGE_EVENT =
  "orybit-session-change";

function notifySessionChange(): void {
  window.dispatchEvent(
    new Event(SESSION_CHANGE_EVENT)
  );
}

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
  notifySessionChange();
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  notifySessionChange();
}
