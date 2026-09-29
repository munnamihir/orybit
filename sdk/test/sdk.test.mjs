import assert from "node:assert/strict";
import test from "node:test";

import {
  OrybitClient,
  OrybitSdkError
} from "../dist/index.js";

function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "content-type": "application/json"
      }
    }
  );
}

test(
  "calls developer APIs with the configured bearer key",
  async () => {
    const calls = [];

    const client = new OrybitClient({
      baseUrl: "https://api.example.test/",
      apiKey: "ory_dev_demo.secret",
      fetch: async (input, init) => {
        const url = input.toString();
        const headers = new Headers(init?.headers);
        calls.push({
          url,
          authorization:
            headers.get("authorization")
        });

        if (url.endsWith("/developer/v1/me")) {
          return jsonResponse({
            data: {
              id: "devkey_demo",
              name: "Demo",
              keyPrefix: "ory_dev_demo",
              scopes: ["objects:read"],
              createdAt: "2026-09-29T00:00:00Z"
            }
          });
        }

        if (
          url.endsWith(
            "/developer/v1/objects/coffee-demo-001"
          )
        ) {
          return jsonResponse({
            data: {
              protocolVersion: "0.1",
              publicId: "coffee-demo-001",
              kind: "appliance",
              identity: {
                name: "Coffee Machine"
              },
              lifecycle: {
                status: "active",
                updatedAt:
                  "2026-09-29T00:00:00Z"
              },
              capabilities: ["manual.view"]
            }
          });
        }

        throw new Error(
          `Unexpected URL ${url}`
        );
      }
    });

    const me = await client.developer.me();
    const object = await client.objects.get(
      "coffee-demo-001"
    );

    assert.equal(me.name, "Demo");
    assert.equal(
      object.publicId,
      "coffee-demo-001"
    );
    assert.equal(calls.length, 2);
    assert.ok(
      calls.every(
        (call) =>
          call.authorization ===
          "Bearer ory_dev_demo.secret"
      )
    );
  }
);

test(
  "exposes manifest and capability clients",
  async () => {
    const client = new OrybitClient({
      baseUrl: "https://api.example.test",
      apiKey: "ory_dev_demo.secret",
      fetch: async (input) => {
        const url = input.toString();

        if (url.includes("/manifests/")) {
          return jsonResponse({
            data: {
              manifestVersion: "0.1",
              protocolVersion: "0.1",
              object: {
                publicId: "coffee-demo-001",
                kind: "appliance",
                identity: {
                  name: "Coffee Machine"
                },
                lifecycle: {
                  status: "active",
                  updatedAt:
                    "2026-09-29T00:00:00Z"
                }
              },
              capabilities: [],
              links: {
                self: "https://api.example.test/manifest/coffee-demo-001",
                profile: "https://api.example.test/o/coffee-demo-001",
                publicApi: "https://api.example.test/public/objects/coffee-demo-001",
                schema: "https://orybit.dev/specs/v0.1/manifest.schema.json"
              }
            }
          });
        }

        return jsonResponse({
          data: [
            {
              protocolVersion: "0.1",
              name: "manual.view",
              title: "View manual",
              description: "View documentation.",
              access: "public",
              operation: "read"
            }
          ],
          count: 1
        });
      }
    });

    const manifest = await client.manifests.get(
      "coffee-demo-001"
    );
    const capabilities =
      await client.capabilities.list(
        "coffee-demo-001"
      );

    assert.equal(
      manifest.manifestVersion,
      "0.1"
    );
    assert.equal(
      capabilities[0].name,
      "manual.view"
    );
  }
);

test(
  "throws structured SDK errors",
  async () => {
    const client = new OrybitClient({
      baseUrl: "https://api.example.test",
      apiKey: "invalid",
      fetch: async () =>
        jsonResponse(
          {
            error: {
              code: "INVALID_DEVELOPER_API_KEY",
              message: "Invalid key."
            }
          },
          401
        )
    });

    await assert.rejects(
      () => client.developer.me(),
      (error) => {
        assert.ok(
          error instanceof OrybitSdkError
        );
        assert.equal(error.status, 401);
        assert.equal(
          error.code,
          "INVALID_DEVELOPER_API_KEY"
        );
        return true;
      }
    );
  }
);
