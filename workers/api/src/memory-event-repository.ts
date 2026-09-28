import type {
  OrybitEvent
} from "@orybit/protocol";

import type {
  EventRepository
} from "./types.js";

export class MemoryEventRepository
implements EventRepository {
  private readonly events =
    new Map<string, OrybitEvent>();

  async append(
    event: OrybitEvent
  ): Promise<OrybitEvent> {
    this.events.set(
      event.id,
      structuredClone(event)
    );

    return structuredClone(event);
  }

  async listForObject(
    objectId: string
  ): Promise<OrybitEvent[]> {
    return [...this.events.values()]
      .filter(
        (event) =>
          event.objectId === objectId
      )
      .sort(
        (a, b) =>
          b.occurredAt.localeCompare(
            a.occurredAt
          )
      )
      .map((event) =>
        structuredClone(event)
      );
  }
}
