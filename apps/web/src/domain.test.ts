import {
  describe,
  expect,
  it
} from "vitest";

import {
  filterObjects,
  parseCapabilities,
  summarizeObjects
} from "./domain";

import type {
  OrybitObject
} from "./types";

const objects: OrybitObject[] = [
  {
    protocolVersion: "0.1",
    id: "obj_alpha",
    publicId: "alpha-001",
    kind: "appliance",
    identity: {
      name: "Coffee Machine",
      manufacturer: "ORYBIT"
    },
    lifecycle: {
      status: "active",
      createdAt: "2026-09-28T12:00:00Z",
      updatedAt: "2026-09-28T12:00:00Z"
    },
    carriers: [],
    capabilities: [
      "manual.view",
      "maintenance.record"
    ],
    metadata: {}
  },
  {
    protocolVersion: "0.1",
    id: "obj_beta",
    publicId: "beta-001",
    kind: "tool",
    identity: {
      name: "Workshop Drill",
      manufacturer: "Demo Tools"
    },
    lifecycle: {
      status: "lost",
      createdAt: "2026-09-28T12:00:00Z",
      updatedAt: "2026-09-28T12:00:00Z"
    },
    carriers: [],
    capabilities: [
      "manual.view"
    ],
    metadata: {}
  }
];

describe(
  "dashboard domain helpers",
  () => {
    it(
      "summarizes registry objects",
      () => {
        expect(
          summarizeObjects(objects)
        ).toEqual({
          total: 2,
          active: 1,
          attention: 1,
          capabilities: 2
        });
      }
    );

    it(
      "filters by text",
      () => {
        expect(
          filterObjects(
            objects,
            "drill",
            "all"
          )
        ).toHaveLength(1);
      }
    );

    it(
      "filters by lifecycle status",
      () => {
        expect(
          filterObjects(
            objects,
            "",
            "lost"
          )
        ).toEqual([
          objects[1]
        ]);
      }
    );

    it(
      "normalizes capabilities",
      () => {
        expect(
          parseCapabilities(
            "manual.view, maintenance.record\nmanual.view"
          )
        ).toEqual([
          "manual.view",
          "maintenance.record"
        ]);
      }
    );
  }
);
