import type {
  OrybitCapability,
  ResolvedObjectCapability
} from "./types";

export function assignedCapabilityNames(
  capabilities: ResolvedObjectCapability[]
): Set<string> {
  return new Set(
    capabilities.map((item) => item.name)
  );
}

export function unresolvedCapabilities(
  capabilities: ResolvedObjectCapability[]
): ResolvedObjectCapability[] {
  return capabilities.filter(
    (item) => item.status === "unresolved"
  );
}

export function sortCapabilityDefinitions(
  definitions: OrybitCapability[]
): OrybitCapability[] {
  return [...definitions].sort(
    (left, right) => {
      const category =
        (left.category ?? "zzz")
          .localeCompare(
            right.category ?? "zzz"
          );

      return category !== 0
        ? category
        : left.name.localeCompare(right.name);
    }
  );
}
