export function ownershipAcceptanceUrl(
  origin: string,
  token: string
): string {
  const normalizedOrigin =
    origin.replace(/\/$/, "");

  return `${normalizedOrigin}/ownership/accept#${encodeURIComponent(
    token
  )}`;
}

export function ownershipTokenFromHash(
  hash: string
): string {
  const value = hash.startsWith("#")
    ? hash.slice(1)
    : hash;

  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}
