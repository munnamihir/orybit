import {
  buildPublicObjectManifest,
  MANIFEST_SCHEMA_URL
} from "./object-manifest.js";

import type {
  CapabilityRepository
} from "./capability-types.js";

import type {
  ObjectRepository
} from "./types.js";

function manifestIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/manifest\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function jsonError(
  status: number,
  code: string,
  message: string
): Response {
  return new Response(
    JSON.stringify(
      {
        error: {
          code,
          message
        }
      },
      null,
      2
    ),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}

export async function handleManifestRequest(
  request: Request,
  objects: ObjectRepository,
  capabilities: CapabilityRepository
): Promise<Response | null> {
  const url = new URL(request.url);
  const publicId =
    manifestIdentifier(url.pathname);

  if (!publicId) {
    return null;
  }

  if (request.method !== "GET") {
    return jsonError(
      405,
      "METHOD_NOT_ALLOWED",
      "The ORYBIT object manifest supports GET only."
    );
  }

  const object =
    await objects.findByIdentifier(publicId);

  if (
    !object ||
    object.publicId !== publicId
  ) {
    return jsonError(
      404,
      "MANIFEST_NOT_FOUND",
      "The requested ORYBIT object manifest was not found."
    );
  }

  const manifest =
    await buildPublicObjectManifest(
      object,
      capabilities,
      url.origin
    );

  return new Response(
    JSON.stringify(manifest, null, 2),
    {
      status: 200,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "link": [
          `<${MANIFEST_SCHEMA_URL}>; rel="describedby"; type="application/schema+json"`,
          `<${manifest.links.profile}>; rel="alternate"; type="text/html"`
        ].join(", ")
      }
    }
  );
}
