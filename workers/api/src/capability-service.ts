import {
  ORYBIT_PROTOCOL_VERSION,
  validateOrybitCapability
} from "@orybit/protocol";

import type {
  OrybitCapability,
  OrybitObject
} from "@orybit/protocol";

import {
  applyObjectPatch
} from "./object-factory.js";

import type {
  CapabilityDefinitionInput,
  CapabilityRepository,
  ResolvedObjectCapability
} from "./capability-types.js";

import type {
  ObjectRepository
} from "./types.js";

export function buildCapabilityDefinition(
  input: CapabilityDefinitionInput
): OrybitCapability {
  const capability: OrybitCapability = {
    protocolVersion: ORYBIT_PROTOCOL_VERSION,
    name: input.name.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    access: input.access,
    requiresApproval:
      input.requiresApproval ?? false,
    ...(input.category?.trim()
      ? { category: input.category.trim() }
      : {}),
    ...(input.operation
      ? { operation: input.operation }
      : {})
  };

  const validation =
    validateOrybitCapability(capability);

  if (!validation.valid) {
    throw new TypeError(
      validation.errors.join(" ")
    );
  }

  return capability;
}

export async function resolveObjectCapabilities(
  object: OrybitObject,
  repository: CapabilityRepository
): Promise<ResolvedObjectCapability[]> {
  return Promise.all(
    object.capabilities.map(async (name) => {
      const definition =
        await repository.find(name);

      return {
        name,
        enabled: true as const,
        status: definition
          ? "defined" as const
          : "unresolved" as const,
        ...(definition
          ? { definition }
          : {})
      };
    })
  );
}

export async function findUndefinedCapabilities(
  names: string[],
  repository: CapabilityRepository
): Promise<string[]> {
  const unique = [...new Set(names)];
  const definitions = await Promise.all(
    unique.map((name) => repository.find(name))
  );

  return unique.filter(
    (_name, index) => !definitions[index]
  );
}

export async function publicCapabilityNames(
  names: string[],
  repository: CapabilityRepository
): Promise<string[]> {
  const definitions = await Promise.all(
    names.map((name) => repository.find(name))
  );

  return names.filter(
    (_name, index) =>
      definitions[index]?.access === "public"
  );
}

export async function setObjectCapability(
  objects: ObjectRepository,
  capabilities: CapabilityRepository,
  identifier: string,
  name: string,
  enabled: boolean
): Promise<OrybitObject> {
  const object =
    await objects.findByIdentifier(identifier);

  if (!object) {
    throw new Error("OBJECT_NOT_FOUND");
  }

  if (enabled) {
    const definition =
      await capabilities.find(name);

    if (!definition) {
      throw new Error("CAPABILITY_NOT_DEFINED");
    }
  }

  const current = new Set(
    object.capabilities
  );

  if (enabled) {
    current.add(name);
  } else {
    current.delete(name);
  }

  const next = applyObjectPatch(
    object,
    {
      capabilities: [...current]
    }
  );

  const updated = await objects.update(
    object.id,
    next
  );

  if (!updated) {
    throw new Error("OBJECT_NOT_FOUND");
  }

  return updated;
}
