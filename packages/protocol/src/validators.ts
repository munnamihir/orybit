import {
  ORYBIT_PROTOCOL_VERSION
} from "./protocol-version.js";

import {
  isEventId,
  isObjectId
} from "./ids.js";

import type {
  ActorType,
  CapabilityAccess,
  CapabilityOperation,
  CarrierType,
  LifecycleStatus,
  OrybitCapability,
  OrybitEvent,
  OrybitObject,
  ValidationResult
} from "./types.js";

const carrierTypes = new Set<CarrierType>([
  "qr",
  "nfc",
  "barcode",
  "ble",
  "other"
]);

const lifecycleStatuses = new Set<LifecycleStatus>([
  "active",
  "inactive",
  "lost",
  "retired"
]);

const actorTypes = new Set<ActorType>([
  "system",
  "user",
  "manufacturer",
  "service-provider",
  "device"
]);

const capabilityAccessValues = new Set<CapabilityAccess>([
  "public",
  "owner",
  "authorized"
]);

const capabilityOperationValues =
  new Set<CapabilityOperation>([
    "read",
    "write",
    "execute"
  ]);

const capabilityNamePattern =
  /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

const capabilityCategoryPattern =
  /^[a-z][a-z0-9-]*$/;

const eventTypePattern =
  /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) &&
    value.includes("T");
}

function isHttpUri(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" ||
      url.protocol === "http:";
  } catch {
    return false;
  }
}

function result(errors: string[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateOrybitObject(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return result([
      "Object must be a JSON object."
    ]);
  }

  if (
    input.protocolVersion !==
    ORYBIT_PROTOCOL_VERSION
  ) {
    errors.push(
      `protocolVersion must be ${ORYBIT_PROTOCOL_VERSION}.`
    );
  }

  if (!isObjectId(input.id)) {
    errors.push(
      "id must be a valid ORYBIT object ID."
    );
  }

  if (
    !isNonEmptyString(input.publicId) ||
    input.publicId.length < 6 ||
    input.publicId.length > 128
  ) {
    errors.push(
      "publicId must contain between 6 and 128 characters."
    );
  }

  if (!isNonEmptyString(input.kind)) {
    errors.push(
      "kind must be a non-empty string."
    );
  }

  if (!isRecord(input.identity)) {
    errors.push(
      "identity must be an object."
    );
  } else if (
    !isNonEmptyString(input.identity.name)
  ) {
    errors.push(
      "identity.name must be a non-empty string."
    );
  }

  if (!isRecord(input.lifecycle)) {
    errors.push(
      "lifecycle must be an object."
    );
  } else {
    if (
      !lifecycleStatuses.has(
        input.lifecycle.status as LifecycleStatus
      )
    ) {
      errors.push(
        "lifecycle.status is not supported."
      );
    }

    if (
      !isIsoDateTime(input.lifecycle.createdAt)
    ) {
      errors.push(
        "lifecycle.createdAt must be a valid date-time."
      );
    }

    if (
      !isIsoDateTime(input.lifecycle.updatedAt)
    ) {
      errors.push(
        "lifecycle.updatedAt must be a valid date-time."
      );
    }
  }

  if (!Array.isArray(input.carriers)) {
    errors.push(
      "carriers must be an array."
    );
  } else {
    input.carriers.forEach(
      (carrier, index) => {
        if (!isRecord(carrier)) {
          errors.push(
            `carriers[${index}] must be an object.`
          );
          return;
        }

        if (
          !carrierTypes.has(
            carrier.type as CarrierType
          )
        ) {
          errors.push(
            `carriers[${index}].type is not supported.`
          );
        }

        if (!isHttpUri(carrier.uri)) {
          errors.push(
            `carriers[${index}].uri must be an HTTP(S) URI.`
          );
        }
      }
    );
  }

  if (!Array.isArray(input.capabilities)) {
    errors.push(
      "capabilities must be an array."
    );
  } else {
    input.capabilities.forEach(
      (capability, index) => {
        if (
          typeof capability !== "string" ||
          !capabilityNamePattern.test(capability)
        ) {
          errors.push(
            `capabilities[${index}] is not a valid capability name.`
          );
        }
      }
    );
  }

  return result(errors);
}

export function validateOrybitEvent(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return result([
      "Event must be a JSON object."
    ]);
  }

  if (
    input.protocolVersion !==
    ORYBIT_PROTOCOL_VERSION
  ) {
    errors.push(
      `protocolVersion must be ${ORYBIT_PROTOCOL_VERSION}.`
    );
  }

  if (!isEventId(input.id)) {
    errors.push(
      "id must be a valid ORYBIT event ID."
    );
  }

  if (!isObjectId(input.objectId)) {
    errors.push(
      "objectId must be a valid ORYBIT object ID."
    );
  }

  if (
    typeof input.type !== "string" ||
    !eventTypePattern.test(input.type)
  ) {
    errors.push(
      "type must use ORYBIT dotted event naming."
    );
  }

  if (!isIsoDateTime(input.occurredAt)) {
    errors.push(
      "occurredAt must be a valid date-time."
    );
  }

  if (!isRecord(input.actor)) {
    errors.push(
      "actor must be an object."
    );
  } else if (
    !actorTypes.has(
      input.actor.type as ActorType
    )
  ) {
    errors.push(
      "actor.type is not supported."
    );
  }

  if (!isRecord(input.data)) {
    errors.push(
      "data must be an object."
    );
  }

  return result(errors);
}

export function validateOrybitCapability(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return result([
      "Capability must be a JSON object."
    ]);
  }

  if (
    input.protocolVersion !==
    ORYBIT_PROTOCOL_VERSION
  ) {
    errors.push(
      `protocolVersion must be ${ORYBIT_PROTOCOL_VERSION}.`
    );
  }

  if (
    typeof input.name !== "string" ||
    !capabilityNamePattern.test(input.name)
  ) {
    errors.push(
      "name must use ORYBIT dotted capability naming."
    );
  }

  if (!isNonEmptyString(input.title)) {
    errors.push(
      "title must be a non-empty string."
    );
  }

  if (!isNonEmptyString(input.description)) {
    errors.push(
      "description must be a non-empty string."
    );
  }

  if (
    !capabilityAccessValues.has(
      input.access as CapabilityAccess
    )
  ) {
    errors.push(
      "access must be public, owner, or authorized."
    );
  }

  if (
    input.requiresApproval !== undefined &&
    typeof input.requiresApproval !== "boolean"
  ) {
    errors.push(
      "requiresApproval must be a boolean when provided."
    );
  }

  if (
    input.category !== undefined &&
    (
      typeof input.category !== "string" ||
      !capabilityCategoryPattern.test(
        input.category
      )
    )
  ) {
    errors.push(
      "category must use lowercase kebab-case."
    );
  }

  if (
    input.operation !== undefined &&
    !capabilityOperationValues.has(
      input.operation as CapabilityOperation
    )
  ) {
    errors.push(
      "operation must be read, write, or execute."
    );
  }

  return result(errors);
}

export function assertOrybitObject(
  input: unknown
): asserts input is OrybitObject {
  const validation = validateOrybitObject(input);

  if (!validation.valid) {
    throw new TypeError(
      `Invalid ORYBIT object: ${validation.errors.join(" ")}`
    );
  }
}

export function assertOrybitEvent(
  input: unknown
): asserts input is OrybitEvent {
  const validation = validateOrybitEvent(input);

  if (!validation.valid) {
    throw new TypeError(
      `Invalid ORYBIT event: ${validation.errors.join(" ")}`
    );
  }
}

export function assertOrybitCapability(
  input: unknown
): asserts input is OrybitCapability {
  const validation =
    validateOrybitCapability(input);

  if (!validation.valid) {
    throw new TypeError(
      `Invalid ORYBIT capability: ${validation.errors.join(" ")}`
    );
  }
}
