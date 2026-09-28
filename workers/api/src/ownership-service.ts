import {
  generateOwnerId,
  generateTransferToken,
  hashTransferToken
} from "./ownership-ids.js";

import type {
  CreateOwnerInput,
  CreateOwnershipTransferInput,
  OrybitOwner,
  OwnershipRepository,
  OwnershipTransfer,
  OwnershipTransferSecret
} from "./types.js";

const DEFAULT_TRANSFER_LIFETIME_MS =
  7 * 24 * 60 * 60 * 1000;

export function buildOwner(
  input: CreateOwnerInput,
  now = new Date().toISOString()
): OrybitOwner {
  const displayName = input.displayName.trim();
  const type = input.type ?? "person";
  const reference = input.reference?.trim();

  if (!displayName) {
    throw new TypeError(
      "displayName is required."
    );
  }

  if (displayName.length > 160) {
    throw new TypeError(
      "displayName must be 160 characters or fewer."
    );
  }

  if (
    type !== "person" &&
    type !== "organization"
  ) {
    throw new TypeError(
      "type must be person or organization."
    );
  }

  if (reference && reference.length > 160) {
    throw new TypeError(
      "reference must be 160 characters or fewer."
    );
  }

  return {
    id: generateOwnerId(),
    displayName,
    type,
    ...(reference ? { reference } : {}),
    createdAt: now
  };
}

export async function createTransferSecret(
  repository: OwnershipRepository,
  objectId: string,
  input: CreateOwnershipTransferInput,
  now = new Date().toISOString()
): Promise<OwnershipTransferSecret> {
  const toOwnerId = input.toOwnerId.trim();

  if (!toOwnerId) {
    throw new TypeError(
      "toOwnerId is required."
    );
  }

  const expiresAt = input.expiresAt ??
    new Date(
      Date.parse(now) +
      DEFAULT_TRANSFER_LIFETIME_MS
    ).toISOString();

  if (
    !Number.isFinite(Date.parse(expiresAt)) ||
    expiresAt <= now
  ) {
    throw new TypeError(
      "expiresAt must be a future date-time."
    );
  }

  const token = generateTransferToken();
  const tokenHash = await hashTransferToken(
    token
  );

  const transfer = await repository.createTransfer(
    objectId,
    toOwnerId,
    tokenHash,
    now,
    expiresAt,
    input.note?.trim() || undefined
  );

  return {
    transfer,
    acceptanceToken: token
  };
}

export async function resolveTransferToken(
  repository: OwnershipRepository,
  token: string,
  now = new Date().toISOString()
): Promise<OwnershipTransfer | null> {
  const normalized = token.trim();

  if (!normalized) {
    return null;
  }

  return repository.resolveTransfer(
    await hashTransferToken(normalized),
    now
  );
}

export async function acceptTransferToken(
  repository: OwnershipRepository,
  token: string,
  now = new Date().toISOString()
): Promise<OwnershipTransfer> {
  const normalized = token.trim();

  if (!normalized) {
    throw new TypeError(
      "Transfer token is required."
    );
  }

  return repository.acceptTransfer(
    await hashTransferToken(normalized),
    now
  );
}
