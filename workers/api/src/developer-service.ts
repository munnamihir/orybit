import {
  DEVELOPER_SCOPES
} from "./developer-types.js";

import type {
  CreateDeveloperApiKeyInput,
  DeveloperApiKey,
  DeveloperApiKeyRecord,
  DeveloperApiKeyRepository,
  DeveloperApiKeySecret,
  DeveloperScope
} from "./developer-types.js";

const API_KEY_HASH_DOMAIN =
  "ORYBIT_DEVELOPER_API_KEY_V1";

const API_KEY_PATTERN =
  /^ory_dev_(devkey_[a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) =>
      value.toString(16).padStart(2, "0")
    )
    .join("");
}

function bytesToBase64Url(
  bytes: Uint8Array
): string {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function uniqueScopes(
  scopes: DeveloperScope[]
): DeveloperScope[] {
  return Array.from(new Set(scopes));
}

export function publicDeveloperApiKey(
  record: DeveloperApiKeyRecord
): DeveloperApiKey {
  const {
    tokenHash: _tokenHash,
    ...safe
  } = record;

  return safe;
}

export function validateDeveloperKeyInput(
  input: CreateDeveloperApiKeyInput
): CreateDeveloperApiKeyInput {
  const name = input.name?.trim();

  if (!name || name.length > 80) {
    throw new TypeError(
      "Developer key name must contain between 1 and 80 characters."
    );
  }

  if (
    !Array.isArray(input.scopes) ||
    input.scopes.length === 0
  ) {
    throw new TypeError(
      "At least one developer scope is required."
    );
  }

  const allowed = new Set<string>(
    DEVELOPER_SCOPES
  );

  if (
    !input.scopes.every(
      (scope) => allowed.has(scope)
    )
  ) {
    throw new TypeError(
      "Developer scopes contain an unsupported value."
    );
  }

  return {
    name,
    scopes: uniqueScopes(input.scopes)
  };
}

export async function hashDeveloperApiKey(
  apiKey: string
): Promise<string> {
  const payload = new TextEncoder().encode(
    `${API_KEY_HASH_DOMAIN}\u0000${apiKey}`
  );

  const digest = await crypto.subtle.digest(
    "SHA-512",
    payload
  );

  return `sha512-v1:${bytesToHex(
    new Uint8Array(digest)
  )}`;
}

export function parseDeveloperApiKey(
  apiKey: string
): { id: string } | null {
  const match = apiKey.match(
    API_KEY_PATTERN
  );

  return match
    ? { id: match[1] }
    : null;
}

export async function createDeveloperApiKey(
  repository: DeveloperApiKeyRepository,
  input: CreateDeveloperApiKeyInput
): Promise<DeveloperApiKeySecret> {
  const validated =
    validateDeveloperKeyInput(input);
  const id = `devkey_${crypto.randomUUID()
    .replaceAll("-", "")}`;
  const secretBytes = new Uint8Array(32);

  crypto.getRandomValues(secretBytes);

  const secret =
    bytesToBase64Url(secretBytes);
  const apiKey =
    `ory_dev_${id}.${secret}`;
  const now = new Date().toISOString();

  const record: DeveloperApiKeyRecord = {
    id,
    name: validated.name,
    keyPrefix:
      `ory_dev_${id.slice(-8)}`,
    scopes: validated.scopes,
    createdAt: now,
    tokenHash:
      await hashDeveloperApiKey(apiKey)
  };

  const created =
    await repository.create(record);

  return {
    key: publicDeveloperApiKey(created),
    apiKey
  };
}

export async function authenticateDeveloperApiKey(
  repository: DeveloperApiKeyRepository,
  request: Request,
  requiredScope?: DeveloperScope
): Promise<DeveloperApiKey | null> {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const apiKey =
    authorization.slice("Bearer ".length).trim();
  const parsed = parseDeveloperApiKey(apiKey);

  if (!parsed) {
    return null;
  }

  const record = await repository.resolve(
    parsed.id,
    await hashDeveloperApiKey(apiKey)
  );

  if (!record || record.revokedAt) {
    return null;
  }

  if (
    requiredScope &&
    !record.scopes.includes(requiredScope)
  ) {
    throw new Error(
      "DEVELOPER_SCOPE_REQUIRED"
    );
  }

  const usedAt = new Date().toISOString();
  await repository.touchLastUsed(
    record.id,
    usedAt
  );

  return {
    ...publicDeveloperApiKey(record),
    lastUsedAt: usedAt
  };
}
