function compactUuid(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function generateOwnerId(): string {
  return `owner_${compactUuid()}`;
}

export function generateOwnershipId(): string {
  return `ownership_${compactUuid()}`;
}

export function generateTransferId(): string {
  return `transfer_${compactUuid()}`;
}

export function generateTransferToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return btoa(
    String.fromCharCode(...bytes)
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function hashTransferToken(
  token: string
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return [...new Uint8Array(digest)]
    .map((value) =>
      value.toString(16).padStart(2, "0")
    )
    .join("");
}
