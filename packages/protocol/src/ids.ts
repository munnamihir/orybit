function normalizedUuid(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function generateObjectId(): string {
  return `obj_${normalizedUuid()}`;
}

export function generateEventId(): string {
  return `evt_${normalizedUuid()}`;
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" &&
    /^obj_[A-Za-z0-9_-]+$/.test(value);
}

export function isEventId(value: unknown): value is string {
  return typeof value === "string" &&
    /^evt_[A-Za-z0-9_-]+$/.test(value);
}
