import type {
  OrybitEvent
} from "@orybit/protocol";

import type {
  D1DatabaseLike,
  EventRepository
} from "./types.js";

interface EventRow {
  id: string;
  object_id: string;
  protocol_version: string;
  type: string;
  occurred_at: string;
  actor_type: string;
  actor_id: string | null;
  data_json: string;
}

function rowToEvent(
  row: EventRow
): OrybitEvent {
  return {
    protocolVersion: "0.1",
    id: row.id,
    objectId: row.object_id,
    type: row.type,
    occurredAt: row.occurred_at,
    actor: {
      type:
        row.actor_type as
          OrybitEvent["actor"]["type"],
      ...(row.actor_id
        ? { id: row.actor_id }
        : {})
    },
    data: JSON.parse(row.data_json)
  };
}

const selectColumns = `
  id,
  object_id,
  protocol_version,
  type,
  occurred_at,
  actor_type,
  actor_id,
  data_json
`;

export class D1EventRepository
implements EventRepository {
  constructor(
    private readonly db: D1DatabaseLike
  ) {}

  async append(
    event: OrybitEvent
  ): Promise<OrybitEvent> {
    const result = await this.db
      .prepare(`
        INSERT INTO object_events (
          id,
          object_id,
          protocol_version,
          type,
          occurred_at,
          actor_type,
          actor_id,
          data_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        event.id,
        event.objectId,
        event.protocolVersion,
        event.type,
        event.occurredAt,
        event.actor.type,
        event.actor.id ?? null,
        JSON.stringify(event.data)
      )
      .run();

    if (!result.success) {
      throw new Error(
        "EVENT_APPEND_FAILED"
      );
    }

    return event;
  }

  async listForObject(
    objectId: string
  ): Promise<OrybitEvent[]> {
    const result = await this.db
      .prepare(`
        SELECT ${selectColumns}
        FROM object_events
        WHERE object_id = ?
        ORDER BY occurred_at DESC, id DESC
      `)
      .bind(objectId)
      .all<EventRow>();

    return (result.results ?? [])
      .map(rowToEvent);
  }
}
