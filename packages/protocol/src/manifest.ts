import {
  ORYBIT_PROTOCOL_VERSION
} from "./protocol-version.js";

import {
  validateOrybitCapability
} from "./validators.js";

import type {
  LifecycleStatus,
  OrybitCapability,
  ValidationResult
} from "./types.js";

export type OrybitManifestVersion = "0.1";

export interface OrybitManifestIdentity {
  name: string;
  manufacturer?: string;
  model?: string;
  description?: string;
}

export interface OrybitManifestObject {
  publicId: string;
  kind: string;
  identity: OrybitManifestIdentity;
  lifecycle: {
    status: LifecycleStatus;
    updatedAt: string;
  };
}

export interface OrybitManifestCapability
extends Omit<OrybitCapability, "access"> {
  access: "public";
}

export interface OrybitManifestLinks {
  self: string;
  profile: string;
  publicApi: string;
  schema: string;
}

export interface OrybitManifest {
  manifestVersion: OrybitManifestVersion;
  protocolVersion: "0.1";
  object: OrybitManifestObject;
  capabilities: OrybitManifestCapability[];
  links: OrybitManifestLinks;
}

const lifecycleStatuses = new Set<LifecycleStatus>([
  "active",
  "inactive",
  "lost",
  "retired"
]);

function result(errors: string[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors
  };
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function isNonEmptyString(
  value: unknown
): value is string {
  return typeof value === "string" &&
    value.trim().length > 0;
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

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return Number.isFinite(Date.parse(value)) &&
    value.includes("T");
}

export function validateOrybitManifest(
  input: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return result([
      "Manifest must be a JSON object."
    ]);
  }

  if (input.manifestVersion !== "0.1") {
    errors.push(
      "manifestVersion must be 0.1."
    );
  }

  if (
    input.protocolVersion !==
    ORYBIT_PROTOCOL_VERSION
  ) {
    errors.push(
      `protocolVersion must be ${ORYBIT_PROTOCOL_VERSION}.`
    );
  }

  if (!isRecord(input.object)) {
    errors.push("object must be an object.");
  } else {
    if (
      !isNonEmptyString(input.object.publicId) ||
      input.object.publicId.length < 6 ||
      input.object.publicId.length > 128
    ) {
      errors.push(
        "object.publicId must contain between 6 and 128 characters."
      );
    }

    if (!isNonEmptyString(input.object.kind)) {
      errors.push(
        "object.kind must be a non-empty string."
      );
    }

    if (!isRecord(input.object.identity)) {
      errors.push(
        "object.identity must be an object."
      );
    } else if (
      !isNonEmptyString(input.object.identity.name)
    ) {
      errors.push(
        "object.identity.name must be a non-empty string."
      );
    }

    if (!isRecord(input.object.lifecycle)) {
      errors.push(
        "object.lifecycle must be an object."
      );
    } else {
      if (
        !lifecycleStatuses.has(
          input.object.lifecycle.status as LifecycleStatus
        )
      ) {
        errors.push(
          "object.lifecycle.status is not supported."
        );
      }

      if (
        !isIsoDateTime(
          input.object.lifecycle.updatedAt
        )
      ) {
        errors.push(
          "object.lifecycle.updatedAt must be a valid date-time."
        );
      }
    }
  }

  if (!Array.isArray(input.capabilities)) {
    errors.push(
      "capabilities must be an array."
    );
  } else {
    input.capabilities.forEach(
      (capability, index) => {
        const validation =
          validateOrybitCapability(capability);

        validation.errors.forEach(
          (message) => errors.push(
            `capabilities[${index}]: ${message}`
          )
        );

        if (
          isRecord(capability) &&
          capability.access !== "public"
        ) {
          errors.push(
            `capabilities[${index}].access must be public in a public manifest.`
          );
        }
      }
    );
  }

  if (!isRecord(input.links)) {
    errors.push("links must be an object.");
  } else {
    [
      "self",
      "profile",
      "publicApi",
      "schema"
    ].forEach((key) => {
      if (!isHttpUri(input.links[key])) {
        errors.push(
          `links.${key} must be an HTTP(S) URI.`
        );
      }
    });
  }

  return result(errors);
}

export function assertOrybitManifest(
  input: unknown
): asserts input is OrybitManifest {
  const validation =
    validateOrybitManifest(input);

  if (!validation.valid) {
    throw new TypeError(
      `Invalid ORYBIT manifest: ${validation.errors.join(" ")}`
    );
  }
}
