import {
  handleCapabilityRequest
} from "./capability-http.js";

import {
  findUndefinedCapabilities,
  publicCapabilityNames
} from "./capability-service.js";

import {
  handleRequest
} from "./http.js";

import {
  handleManifestRequest
} from "./manifest-http.js";

import {
  toPublicObjectProfile
} from "./public-object.js";

import type {
  CapabilityRepository
} from "./capability-types.js";

import type {
  EventRepository,
  ObjectRepository,
  OwnershipRepository,
  RequestRuntimeOptions
} from "./types.js";

function json(
  body: unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(
    JSON.stringify(body, null, 2),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control": "no-store",
        ...headers
      }
    }
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function hasAdminAccess(
  request: Request,
  options: RequestRuntimeOptions
): boolean {
  return Boolean(options.adminToken) &&
    request.headers.get("authorization") ===
      `Bearer ${options.adminToken}`;
}

function publicObjectIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/public\/objects\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function objectMutationWithCapabilities(
  request: Request,
  pathname: string
): boolean {
  return (
    request.method === "POST" &&
    pathname === "/v1/objects"
  ) || (
    request.method === "PATCH" &&
    /^\/v1\/objects\/[^/]+$/.test(pathname)
  );
}

export async function handleRuntimeRequest(
  request: Request,
  objects: ObjectRepository,
  options: RequestRuntimeOptions = {},
  events?: EventRepository,
  ownership?: OwnershipRepository,
  capabilities?: CapabilityRepository
): Promise<Response> {
  if (capabilities) {
    const manifestResponse =
      await handleManifestRequest(
        request,
        objects,
        capabilities
      );

    if (manifestResponse) {
      return manifestResponse;
    }

    const capabilityResponse =
      await handleCapabilityRequest(
        request,
        objects,
        capabilities,
        options
      );

    if (capabilityResponse) {
      return capabilityResponse;
    }

    const url = new URL(request.url);
    const publicId =
      publicObjectIdentifier(url.pathname);

    if (
      request.method === "GET" &&
      publicId
    ) {
      const object =
        await objects.findByIdentifier(publicId);

      if (
        object &&
        object.publicId === publicId
      ) {
        const visibleCapabilities =
          await publicCapabilityNames(
            object.capabilities,
            capabilities
          );

        const encodedId =
          encodeURIComponent(object.publicId);
        const manifestUrl = new URL(
          `/manifest/${encodedId}`,
          url.origin
        ).toString();

        return json(
          {
            data: toPublicObjectProfile({
              ...object,
              capabilities: visibleCapabilities
            })
          },
          200,
          {
            link:
              `<${manifestUrl}>; rel="describedby"; type="application/json"`
          }
        );
      }
    }

    if (
      hasAdminAccess(request, options) &&
      objectMutationWithCapabilities(
        request,
        url.pathname
      )
    ) {
      try {
        const body =
          await request.clone().json();

        if (
          isRecord(body) &&
          Array.isArray(body.capabilities)
        ) {
          if (
            !body.capabilities.every(
              (name) => typeof name === "string"
            )
          ) {
            return json(
              {
                error: {
                  code: "INVALID_CAPABILITY_REFERENCE",
                  message:
                    "Object capabilities must be capability names."
                }
              },
              400
            );
          }

          const missing =
            await findUndefinedCapabilities(
              body.capabilities as string[],
              capabilities
            );

          if (missing.length > 0) {
            return json(
              {
                error: {
                  code: "CAPABILITY_NOT_DEFINED",
                  message:
                    "Every assigned capability must have a registered definition.",
                  details: missing
                }
              },
              400
            );
          }
        }
      } catch {
        // Existing request validation owns malformed JSON errors.
      }
    }
  }

  return handleRequest(
    request,
    objects,
    options,
    events,
    ownership
  );
}
