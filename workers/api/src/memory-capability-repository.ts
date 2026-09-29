import type {
  OrybitCapability
} from "@orybit/protocol";

import type {
  CapabilityRepository
} from "./capability-types.js";

export class MemoryCapabilityRepository
implements CapabilityRepository {
  private readonly capabilities =
    new Map<string, OrybitCapability>();

  async create(
    capability: OrybitCapability
  ): Promise<OrybitCapability> {
    if (
      this.capabilities.has(capability.name)
    ) {
      throw new Error(
        "CAPABILITY_ALREADY_EXISTS"
      );
    }

    this.capabilities.set(
      capability.name,
      structuredClone(capability)
    );

    return structuredClone(capability);
  }

  async list(): Promise<OrybitCapability[]> {
    return [...this.capabilities.values()]
      .sort((left, right) =>
        left.name.localeCompare(right.name)
      )
      .map((capability) =>
        structuredClone(capability)
      );
  }

  async find(
    name: string
  ): Promise<OrybitCapability | null> {
    const capability =
      this.capabilities.get(name);

    return capability
      ? structuredClone(capability)
      : null;
  }

  async update(
    name: string,
    capability: OrybitCapability
  ): Promise<OrybitCapability | null> {
    if (!this.capabilities.has(name)) {
      return null;
    }

    if (name !== capability.name) {
      throw new Error(
        "CAPABILITY_NAME_IMMUTABLE"
      );
    }

    this.capabilities.set(
      name,
      structuredClone(capability)
    );

    return structuredClone(capability);
  }
}
