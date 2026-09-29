import {
  publicCapabilityNames,
  resolveObjectCapabilities
} from "./capability-service.js";

import type {
  CapabilityRepository
} from "./capability-types.js";

import {
  buildPublicObjectManifest
} from "./object-manifest.js";

import {
  toPublicObjectProfile
} from "./public-object.js";

import {
  authenticateDeveloperApiKey,
  createDeveloperApiKey,
  publicDeveloperApiKey
} from "./developer-service.js";

import type {
  CreateDeveloperApiKeyInput,
  DeveloperApiKeyRepository,
  DeveloperScope
} from "./developer-types.js";

import type {
  ObjectRepository,
  RequestRuntimeOptions
} from "./types.js";

function json(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body, null, 2),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      }
    }
  );
}

function error(
  status: number,
  code: string,
  message: string,
  details?: string[]
): Response {
  return json(
    {
      error: {
        code,
        message,
        ...(details && details.length > 0
          ? { details }
          : {})
      }
    },
    status
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function adminFailure(
  request: Request,
  options: RequestRuntimeOptions
): Response | null {
  if (!options.adminToken) {
    return error(
      503,
      "ADMIN_AUTH_NOT_CONFIGURED",
      "ORYBIT admin authentication is not configured."
    );
  }

  if (
    request.headers.get("authorization") !==
      `Bearer ${options.adminToken}`
  ) {
    return error(
      401,
      "UNAUTHORIZED",
      "A valid ORYBIT admin token is required."
    );
  }

  return null;
}

function revokeIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/developer-keys\/([^/]+)\/revoke$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function developerObjectIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/developer\/v1\/objects\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function developerManifestIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/developer\/v1\/manifests\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function developerCapabilityIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/developer\/v1\/objects\/([^/]+)\/capabilities$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

async function authenticate(
  repository: DeveloperApiKeyRepository,
  request: Request,
  scope?: DeveloperScope
) {
  try {
    const key =
      await authenticateDeveloperApiKey(
        repository,
        request,
        scope
      );

    if (!key) {
      return {
        response: error(
          401,
          "INVALID_DEVELOPER_API_KEY",
          "A valid ORYBIT developer API key is required."
        )
      };
    }

    return { key };
  } catch (cause) {
    if (
      cause instanceof Error &&
      cause.message ===
        "DEVELOPER_SCOPE_REQUIRED"
    ) {
      return {
        response: error(
          403,
          "DEVELOPER_SCOPE_REQUIRED",
          `The developer API key requires the ${scope} scope.`
        )
      };
    }

    throw cause;
  }
}

export async function handleDeveloperPlatformRequest(
  request: Request,
  objects: ObjectRepository,
  capabilities: CapabilityRepository,
  developerKeys: DeveloperApiKeyRepository,
  options: RequestRuntimeOptions = {}
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (
    pathname === "/v1/developer-keys" ||
    revokeIdentifier(pathname)
  ) {
    const failure =
      adminFailure(request, options);

    if (failure) {
      return failure;
    }

    if (
      pathname === "/v1/developer-keys" &&
      request.method === "GET"
    ) {
      const keys =
        await developerKeys.list();

      return json({
        data: keys.map(publicDeveloperApiKey),
        count: keys.length
      });
    }

    if (
      pathname === "/v1/developer-keys" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        if (
          !isRecord(body) ||
          typeof body.name !== "string" ||
          !Array.isArray(body.scopes) ||
          !body.scopes.every(
            (scope) => typeof scope === "string"
          )
        ) {
          return error(
            400,
            "INVALID_DEVELOPER_KEY",
            "name and scopes are required."
          );
        }

        const secret =
          await createDeveloperApiKey(
            developerKeys,
            body as unknown as
              CreateDeveloperApiKeyInput
          );

        return json(
          { data: secret },
          201
        );
      } catch (cause) {
        return error(
          400,
          "INVALID_DEVELOPER_KEY",
          cause instanceof Error
            ? cause.message
            : "Developer key creation failed."
        );
      }
    }

    const revokeId =
      revokeIdentifier(pathname);

    if (
      revokeId &&
      request.method === "POST"
    ) {
      const revoked =
        await developerKeys.revoke(
          revokeId,
          new Date().toISOString()
        );

      if (!revoked) {
        return error(
          404,
          "DEVELOPER_KEY_NOT_FOUND",
          "The developer API key was not found."
        );
      }

      return json({
        data: publicDeveloperApiKey(revoked)
      });
    }

    return error(
      405,
      "METHOD_NOT_ALLOWED",
      "The developer key management route does not support this method."
    );
  }

  if (!pathname.startsWith("/developer/v1")) {
    return null;
  }

  if (request.method !== "GET") {
    return error(
      405,
      "METHOD_NOT_ALLOWED",
      "Step 012 developer APIs are read-only."
    );
  }

  if (pathname === "/developer/v1/me") {
    const auth = await authenticate(
      developerKeys,
      request
    );

    if (auth.response) {
      return auth.response;
    }

    return json({ data: auth.key });
  }

  const objectId =
    developerObjectIdentifier(pathname);

  if (objectId) {
    const auth = await authenticate(
      developerKeys,
      request,
      "objects:read"
    );

    if (auth.response) {
      return auth.response;
    }

    const object =
      await objects.findByIdentifier(objectId);

    if (
      !object ||
      object.publicId !== objectId
    ) {
      return error(
        404,
        "DEVELOPER_OBJECT_NOT_FOUND",
        "The requested public ORYBIT object was not found."
      );
    }

    const visibleCapabilities =
      await publicCapabilityNames(
        object.capabilities,
        capabilities
      );

    return json({
      data: toPublicObjectProfile({
        ...object,
        capabilities: visibleCapabilities
      })
    });
  }

  const manifestId =
    developerManifestIdentifier(pathname);

  if (manifestId) {
    const auth = await authenticate(
      developerKeys,
      request,
      "manifests:read"
    );

    if (auth.response) {
      return auth.response;
    }

    const object =
      await objects.findByIdentifier(manifestId);

    if (
      !object ||
      object.publicId !== manifestId
    ) {
      return error(
        404,
        "DEVELOPER_MANIFEST_NOT_FOUND",
        "The requested ORYBIT manifest was not found."
      );
    }

    return json({
      data: await buildPublicObjectManifest(
        object,
        capabilities,
        url.origin
      )
    });
  }

  const capabilityId =
    developerCapabilityIdentifier(pathname);

  if (capabilityId) {
    const auth = await authenticate(
      developerKeys,
      request,
      "capabilities:read"
    );

    if (auth.response) {
      return auth.response;
    }

    const object =
      await objects.findByIdentifier(capabilityId);

    if (
      !object ||
      object.publicId !== capabilityId
    ) {
      return error(
        404,
        "DEVELOPER_OBJECT_NOT_FOUND",
        "The requested public ORYBIT object was not found."
      );
    }

    const resolved =
      await resolveObjectCapabilities(
        object,
        capabilities
      );

    const visible = resolved
      .flatMap((item) =>
        item.definition?.access === "public"
          ? [item.definition]
          : []
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    return json({
      data: visible,
      count: visible.length
    });
  }

  return error(
    404,
    "DEVELOPER_ROUTE_NOT_FOUND",
    "The requested ORYBIT developer API route was not found."
  );
}
