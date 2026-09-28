const TRANSFER_TOKEN_HASH_DOMAIN =
  "ORYBIT_TRANSFER_TOKEN_V1";

const TRANSFER_TOKEN_HASH_PREFIX =
  "sha512-v1";

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
  const encoded = new TextEncoder().encode(
    `${TRANSFER_TOKEN_HASH_DOMAIN}\u0000${token}`
  );

  const digest = await crypto.subtle.digest(
    "SHA-512",
    encoded
  );

  const hex = [...new Uint8Array(digest)]
    .map((value) =>
      value.toString(16).padStart(2, "0")
    )
    .join("");

  return `${TRANSFER_TOKEN_HASH_PREFIX}:${hex}`;
}
