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
  "OrybitApi",
  () => {
    it(
      "adds bearer authorization",
      async () => {
        const fetchMock = vi.fn(
          async (
            _input: RequestInfo | URL,
            init?: RequestInit
          ) => {
            const headers =
              new Headers(init?.headers);

            expect(
              headers.get(
                "authorization"
              )
            ).toBe(
              "Bearer test-token"
            );

            return new Response(
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
            );
          }
        );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const api =
          new OrybitApi(
            "test-token"
          );

        await expect(
          api.listObjects()
        ).resolves.toEqual([]);
      }
    );

    it(
      "keeps health public",
      async () => {
        const fetchMock = vi.fn(
          async (
            _input: RequestInfo | URL,
            init?: RequestInit
          ) => {
            const headers =
              new Headers(init?.headers);

            expect(
              headers.has(
                "authorization"
              )
            ).toBe(false);

            return new Response(
              JSON.stringify({
                status: "ok",
                service:
                  "orybit-object-registry",
                protocolVersion: "0.1"
              }),
              {
                status: 200
              }
            );
          }
        );

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const api =
          new OrybitApi(
            "test-token"
          );

        await expect(
          api.health()
        ).resolves.toMatchObject({
          status: "ok"
        });
      }
    );

    it(
      "surfaces structured API errors",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(
            async () =>
              new Response(
                JSON.stringify({
                  error: {
                    code: "UNAUTHORIZED",
                    message:
                      "Authentication is required."
                  }
                }),
                {
                  status: 401
                }
              )
          )
        );

        const api =
          new OrybitApi("bad");

        await expect(
          api.listObjects()
        ).rejects.toMatchObject({
          status: 401,
          code: "UNAUTHORIZED"
        });
      }
    );
  }
);
