import {
  ORYBIT_PROTOCOL_VERSION,
  generateObjectId,
  validateOrybitObject
} from "@orybit/protocol";

import type {
  OrybitObject
} from "@orybit/protocol";

import type {
  CreateObjectInput,
  UpdateObjectInput
} from "./types.js";

function createPublicId(): string {
  return `o-${crypto.randomUUID()
    .replaceAll("-", "")
    .slice(0, 16)}`;
}

export function buildNewObject(
  input: CreateObjectInput,
  now = new Date().toISOString()
): OrybitObject {
  const object: OrybitObject = {
    protocolVersion: ORYBIT_PROTOCOL_VERSION,
    id: generateObjectId(),
    publicId: input.publicId ?? createPublicId(),
    kind: input.kind,
    identity: {
      ...input.identity
    },
    lifecycle: {
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    carriers: input.carriers ?? [],
    capabilities: input.capabilities ?? [],
    metadata: input.metadata ?? {}
  };

  const validation =
    validateOrybitObject(object);

  if (!validation.valid) {
    throw new TypeError(
      validation.errors.join(" ")
    );
  }

  return object;
}

export function applyObjectPatch(
  current: OrybitObject,
  patch: UpdateObjectInput,
  now = new Date().toISOString()
): OrybitObject {
  const next: OrybitObject = {
    ...current,
    kind: patch.kind ?? current.kind,
    identity: {
      ...current.identity,
      ...(patch.identity ?? {})
    },
    lifecycle: {
      ...current.lifecycle,
      ...(patch.lifecycle ?? {}),
      updatedAt: now
    },
    carriers:
      patch.carriers ?? current.carriers,
    capabilities:
      patch.capabilities ?? current.capabilities,
    metadata:
      patch.metadata ?? current.metadata
  };

  const validation =
    validateOrybitObject(next);

  if (!validation.valid) {
    throw new TypeError(
      validation.errors.join(" ")
    );
  }

  return next;
}
