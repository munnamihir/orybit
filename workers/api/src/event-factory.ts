import {
  ORYBIT_PROTOCOL_VERSION,
  generateEventId,
  validateOrybitEvent
} from "@orybit/protocol";

import type {
  OrybitEvent
} from "@orybit/protocol";

import type {
  CreateEventInput
} from "./types.js";

export function buildNewEvent(
  objectId: string,
  input: CreateEventInput,
  now = new Date().toISOString()
): OrybitEvent {
  const event: OrybitEvent = {
    protocolVersion: ORYBIT_PROTOCOL_VERSION,
    id: generateEventId(),
    objectId,
    type: input.type,
    occurredAt: input.occurredAt ?? now,
    actor: input.actor ?? {
      type: "user"
    },
    data: input.data ?? {}
  };

  const validation =
    validateOrybitEvent(event);

  if (!validation.valid) {
    throw new TypeError(
      validation.errors.join(" ")
    );
  }

  return event;
}
