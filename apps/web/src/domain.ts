import type {
  DashboardSummary,
  LifecycleStatus,
  OrybitObject
} from "./types";

export function summarizeObjects(
  objects: OrybitObject[]
): DashboardSummary {
  const capabilitySet = new Set<string>();

  for (const object of objects) {
    for (const capability of object.capabilities) {
      capabilitySet.add(capability);
    }
  }

  return {
    total: objects.length,
    active: objects.filter(
      (object) =>
        object.lifecycle.status === "active"
    ).length,
    attention: objects.filter(
      (object) =>
        object.lifecycle.status === "lost" ||
        object.lifecycle.status === "inactive"
    ).length,
    capabilities: capabilitySet.size
  };
}

export function filterObjects(
  objects: OrybitObject[],
  query: string,
  status: "all" | LifecycleStatus
): OrybitObject[] {
  const normalizedQuery =
    query.trim().toLowerCase();

  return objects.filter((object) => {
    const matchesStatus =
      status === "all" ||
      object.lifecycle.status === status;

    if (!matchesStatus) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchable = [
      object.id,
      object.publicId,
      object.kind,
      object.identity.name,
      object.identity.manufacturer,
      object.identity.model,
      object.identity.serial,
      ...object.capabilities
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(
      normalizedQuery
    );
  });
}

export function parseCapabilities(
  value: string
): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}

export function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}
