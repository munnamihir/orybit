import type {
  OrybitObject
} from "@orybit/protocol";

import type {
  ObjectRepository
} from "./types.js";

export class MemoryObjectRepository
implements ObjectRepository {
  private readonly objects =
    new Map<string, OrybitObject>();

  async create(
    object: OrybitObject
  ): Promise<OrybitObject> {
    for (const existing of this.objects.values()) {
      if (
        existing.publicId === object.publicId
      ) {
        throw new Error(
          "PUBLIC_ID_ALREADY_EXISTS"
        );
      }
    }

    this.objects.set(
      object.id,
      structuredClone(object)
    );

    return structuredClone(object);
  }

  async list(): Promise<OrybitObject[]> {
    return [...this.objects.values()]
      .sort(
        (a, b) =>
          b.lifecycle.createdAt.localeCompare(
            a.lifecycle.createdAt
          )
      )
      .map((object) =>
        structuredClone(object)
      );
  }

  async findByIdentifier(
    identifier: string
  ): Promise<OrybitObject | null> {
    const direct =
      this.objects.get(identifier);

    if (direct) {
      return structuredClone(direct);
    }

    for (const object of this.objects.values()) {
      if (
        object.publicId === identifier
      ) {
        return structuredClone(object);
      }
    }

    return null;
  }

  async update(
    id: string,
    object: OrybitObject
  ): Promise<OrybitObject | null> {
    if (!this.objects.has(id)) {
      return null;
    }

    this.objects.set(
      id,
      structuredClone(object)
    );

    return structuredClone(object);
  }
}
