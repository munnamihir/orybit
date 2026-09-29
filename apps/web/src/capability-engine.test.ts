import {
  describe,
  expect,
  it
} from "vitest";

import {
  assignedCapabilityNames,
  sortCapabilityDefinitions,
  unresolvedCapabilities
} from "./capability-domain";

import type {
  OrybitCapability,
  ResolvedObjectCapability
} from "./types";

const definitions: OrybitCapability[] = [
  {
    protocolVersion: "0.1",
    name: "ownership.transfer",
    title: "Transfer ownership",
    description: "Transfer control.",
    access: "owner",
    category: "ownership",
    operation: "execute"
  },
  {
    protocolVersion: "0.1",
    name: "manual.view",
    title: "View manual",
    description: "Read documentation.",
    access: "public",
    category: "documentation",
    operation: "read"
  }
];

describe("capability engine domain helpers", () => {
  it("indexes assigned capability names", () => {
    const resolved: ResolvedObjectCapability[] = [
      {
        name: "manual.view",
        enabled: true,
        status: "defined",
        definition: definitions[1]
      }
    ];

    expect(
      assignedCapabilityNames(resolved)
        .has("manual.view")
    ).toBe(true);
  });

  it("detects unresolved legacy references", () => {
    const resolved: ResolvedObjectCapability[] = [
      {
        name: "legacy.custom",
        enabled: true,
        status: "unresolved"
      }
    ];

    expect(
      unresolvedCapabilities(resolved)
        .map((item) => item.name)
    ).toEqual(["legacy.custom"]);
  });

  it("sorts definitions by category then name", () => {
    expect(
      sortCapabilityDefinitions(definitions)
        .map((item) => item.name)
    ).toEqual([
      "manual.view",
      "ownership.transfer"
    ]);
  });
});
