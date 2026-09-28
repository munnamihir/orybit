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

import {
  ownershipAcceptanceUrl,
  ownershipTokenFromHash
} from "./ownership-link";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(
  "ownership transfer links",
  () => {
    it(
      "keeps the secret in the URL fragment",
      () => {
        const url = ownershipAcceptanceUrl(
          "https://orybit.example",
          "secret/token+value"
        );

        expect(url).toBe(
          "https://orybit.example/ownership/accept#secret%2Ftoken%2Bvalue"
        );

        const parsed = new URL(url);

        expect(parsed.pathname).toBe(
          "/ownership/accept"
        );
        expect(parsed.search).toBe("");
        expect(
          ownershipTokenFromHash(
            parsed.hash
          )
        ).toBe("secret/token+value");
      }
    );

    it(
      "rejects malformed encoded fragments",
      () => {
        expect(
          ownershipTokenFromHash("#%ZZ")
        ).toBe("");
      }
    );
  }
);

describe(
  "public ownership transfer API",
  () => {
    it(
      "does not send the admin bearer token when previewing a transfer",
      async () => {
        const fetchMock = vi.fn(
          async (
            input: RequestInfo | URL,
            init?: RequestInit
          ) => {
            expect(input).toBe(
              "/public/ownership-transfers/preview"
            );

            const headers =
              new Headers(init?.headers);

            expect(
              headers.has("authorization")
            ).toBe(false);

            expect(
              JSON.parse(
                init?.body as string
              )
            ).toEqual({
              token: "transfer-secret"
            });

            return new Response(
              JSON.stringify({
                data: {
                  transfer: {
                    id: "transfer_demo",
                    status: "pending",
                    requestedAt:
                      "2026-09-28T20:00:00Z",
                    expiresAt:
                      "2026-10-05T20:00:00Z",
                    fromOwner: {
                      displayName: "Owner A",
                      type: "person"
                    },
                    toOwner: {
                      displayName: "Owner B",
                      type: "person"
                    }
                  },
                  object: {
                    protocolVersion: "0.1",
                    publicId: "demo-object",
                    kind: "tool",
                    identity: {
                      name: "Demo Tool"
                    },
                    lifecycle: {
                      status: "active",
                      updatedAt:
                        "2026-09-28T20:00:00Z"
                    },
                    capabilities: []
                  }
                }
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

        await expect(
          new OrybitApi("admin-secret")
            .previewOwnershipTransfer(
              "transfer-secret"
            )
        ).resolves.toMatchObject({
          transfer: {
            status: "pending"
          }
        });
      }
    );
  }
);
