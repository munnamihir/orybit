import type {
  LifecycleStatus,
  OrybitCapability,
  OrybitManifest
} from "@orybit/protocol";

export type DeveloperScope =
  | "objects:read"
  | "manifests:read"
  | "capabilities:read";

export interface DeveloperIdentity {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: DeveloperScope[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface DeveloperObjectProfile {
  protocolVersion: string;
  publicId: string;
  kind: string;
  identity: {
    name: string;
    manufacturer?: string;
    model?: string;
    description?: string;
  };
  lifecycle: {
    status: LifecycleStatus;
    updatedAt: string;
  };
  capabilities: string[];
}

export interface OrybitClientOptions {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof globalThis.fetch;
}

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<T> {
  data: T[];
  count: number;
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: string[];
  };
}

export class OrybitSdkError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: string[];

  constructor(
    message: string,
    status: number,
    code?: string,
    details: string[] = []
  ) {
    super(message);
    this.name = "OrybitSdkError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class OrybitClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof globalThis.fetch;

  readonly developer: {
    me: () => Promise<DeveloperIdentity>;
  };

  readonly objects: {
    get: (
      publicId: string
    ) => Promise<DeveloperObjectProfile>;
  };

  readonly manifests: {
    get: (
      publicId: string
    ) => Promise<OrybitManifest>;
  };

  readonly capabilities: {
    list: (
      publicId: string
    ) => Promise<OrybitCapability[]>;
  };

  constructor(options: OrybitClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new TypeError(
        "ORYBIT apiKey is required."
      );
    }

    let base: URL;

    try {
      base = new URL(options.baseUrl);
    } catch {
      throw new TypeError(
        "ORYBIT baseUrl must be an absolute HTTP(S) URL."
      );
    }

    if (
      base.protocol !== "https:" &&
      base.protocol !== "http:"
    ) {
      throw new TypeError(
        "ORYBIT baseUrl must use HTTP(S)."
      );
    }

    const fetcher =
      options.fetch ?? globalThis.fetch;

    if (!fetcher) {
      throw new TypeError(
        "A fetch implementation is required."
      );
    }

    this.baseUrl =
      base.toString().replace(/\/$/, "");
    this.apiKey = options.apiKey.trim();
    this.fetcher = fetcher;

    this.developer = {
      me: () =>
        this.request<DeveloperIdentity>(
          "/developer/v1/me"
        )
    };

    this.objects = {
      get: (publicId) =>
        this.request<DeveloperObjectProfile>(
          `/developer/v1/objects/${encodeURIComponent(
            publicId
          )}`
        )
    };

    this.manifests = {
      get: (publicId) =>
        this.request<OrybitManifest>(
          `/developer/v1/manifests/${encodeURIComponent(
            publicId
          )}`
        )
    };

    this.capabilities = {
      list: (publicId) =>
        this.requestList<OrybitCapability>(
          `/developer/v1/objects/${encodeURIComponent(
            publicId
          )}/capabilities`
        )
    };
  }

  private async request<T>(
    path: string
  ): Promise<T> {
    const response = await this.fetcher(
      `${this.baseUrl}${path}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization:
            `Bearer ${this.apiKey}`
        }
      }
    );

    const payload =
      await this.readPayload(response);

    if (!response.ok) {
      throw this.toError(
        response.status,
        payload
      );
    }

    return (
      payload as ApiEnvelope<T>
    ).data;
  }

  private async requestList<T>(
    path: string
  ): Promise<T[]> {
    const response = await this.fetcher(
      `${this.baseUrl}${path}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization:
            `Bearer ${this.apiKey}`
        }
      }
    );

    const payload =
      await this.readPayload(response);

    if (!response.ok) {
      throw this.toError(
        response.status,
        payload
      );
    }

    return (
      payload as ApiListEnvelope<T>
    ).data;
  }

  private async readPayload(
    response: Response
  ): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private toError(
    status: number,
    payload: unknown
  ): OrybitSdkError {
    const envelope =
      payload &&
      typeof payload === "object"
        ? payload as ErrorEnvelope
        : {};

    return new OrybitSdkError(
      envelope.error?.message ??
        `ORYBIT request failed with ${status}.`,
      status,
      envelope.error?.code,
      envelope.error?.details ?? []
    );
  }
}

export type {
  OrybitCapability,
  OrybitManifest
};
