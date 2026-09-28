import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  OrybitApi
} from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(
  "object memory API client",
  () => {
    it(
      "loads object events with admin authorization",
      async () => {
        const fetchMock = vi.fn(
          async () => new Response(
            JSON.stringify({
              data: [],
              count: 0
            }),
            {
              status: 200,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          )
        );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await new OrybitApi("secret")
          .listObjectEvents(
            "demo-object"
          );

        const [path, init] =
          fetchMock.mock.calls[0];

        expect(path).toBe(
          "/v1/objects/demo-object/events"
        );

        expect(
          new Headers(
            (init as RequestInit).headers
          ).get("authorization")
        ).toBe("Bearer secret");
      }
    );

    it(
      "posts append-only lifecycle events",
      async () => {
        const fetchMock = vi.fn(
          async () => new Response(
            JSON.stringify({
              data: {
                protocolVersion: "0.1",
                id: "evt_test",
                objectId: "obj_test",
                type:
                  "maintenance.completed",
                occurredAt:
                  "2026-09-28T20:00:00Z",
                actor: {
                  type: "user"
                },
                data: {
                  note:
                    "Battery inspected"
                }
              }
            }),
            {
              status: 201,
              headers: {
                "content-type":
                  "application/json"
              }
            }
          )
        );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        await new OrybitApi("secret")
          .createObjectEvent(
            "demo-object",
            {
              type:
                "maintenance.completed",
              data: {
                note:
                  "Battery inspected"
              }
            }
          );

        const [path, init] =
          fetchMock.mock.calls[0];

        expect(path).toBe(
          "/v1/objects/demo-object/events"
        );
        expect(
          (init as RequestInit).method
        ).toBe("POST");
        expect(
          JSON.parse(
            (init as RequestInit)
              .body as string
          ).type
        ).toBe(
          "maintenance.completed"
        );
      }
    );
  }
);
