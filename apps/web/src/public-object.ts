import encodeQR from "qr";

export interface PublicObjectProfile {
  protocolVersion: "0.1";
  publicId: string;
  kind: string;
  identity: {
    name: string;
    manufacturer?: string;
    model?: string;
    description?: string;
  };
  lifecycle: {
    status:
      | "active"
      | "inactive"
      | "lost"
      | "retired";
    updatedAt: string;
  };
  capabilities: string[];
}

interface PublicObjectEnvelope {
  data: PublicObjectProfile;
}

interface ErrorEnvelope {
  error?: {
    message?: string;
  };
}

export function publicObjectPath(
  publicId: string
): string {
  return `/o/${encodeURIComponent(publicId)}`;
}

export function publicObjectUrl(
  origin: string,
  publicId: string
): string {
  return `${origin}${publicObjectPath(publicId)}`;
}

export function publicObjectQrDataUrl(
  origin: string,
  publicId: string
): string {
  return encodeQR(
    publicObjectUrl(origin, publicId),
    "data-url",
    {
      scale: 8
    }
  );
}

export async function fetchPublicObject(
  publicId: string
): Promise<PublicObjectProfile> {
  const response = await fetch(
    `/public/objects/${encodeURIComponent(publicId)}`,
    {
      headers: {
        accept: "application/json"
      }
    }
  );

  const payload =
    await response.json() as
      PublicObjectEnvelope | ErrorEnvelope;

  if (!response.ok) {
    const message =
      "error" in payload
        ? payload.error?.message
        : undefined;

    throw new Error(
      message ??
      "Unable to load this ORYBIT object."
    );
  }

  return (
    payload as PublicObjectEnvelope
  ).data;
}
