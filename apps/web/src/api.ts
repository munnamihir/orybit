import type {
  CreateObjectInput,
  HealthResponse,
  OrybitObject,
  UpdateObjectInput
} from "./types";

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

export class OrybitApiError
extends Error {
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
    this.name = "OrybitApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class OrybitApi {
  constructor(
    private readonly token: string
  ) {}

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>(
      "/health",
      {},
      false
    );
  }

  async listObjects():
  Promise<OrybitObject[]> {
    const response =
      await this.request<
        ApiListEnvelope<OrybitObject>
      >("/v1/objects");

    return response.data;
  }

  async getObject(
    identifier: string
  ): Promise<OrybitObject> {
    const response =
      await this.request<
        ApiEnvelope<OrybitObject>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}`
      );

    return response.data;
  }

  async createObject(
    input: CreateObjectInput
  ): Promise<OrybitObject> {
    const response =
      await this.request<
        ApiEnvelope<OrybitObject>
      >(
        "/v1/objects",
        {
          method: "POST",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  async updateObject(
    identifier: string,
    input: UpdateObjectInput
  ): Promise<OrybitObject> {
    const response =
      await this.request<
        ApiEnvelope<OrybitObject>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}`,
        {
          method: "PATCH",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true
  ): Promise<T> {
    const headers =
      new Headers(init.headers);

    headers.set(
      "accept",
      "application/json"
    );

    if (init.body) {
      headers.set(
        "content-type",
        "application/json"
      );
    }

    if (authenticated) {
      headers.set(
        "authorization",
        `Bearer ${this.token}`
      );
    }

    const response = await fetch(
      path,
      {
        ...init,
        headers
      }
    );

    const text = await response.text();

    let payload: unknown = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const envelope =
        payload &&
        typeof payload === "object"
          ? payload as ErrorEnvelope
          : {};

      const message =
        envelope.error?.message ??
        `ORYBIT request failed with ${response.status}.`;

      throw new OrybitApiError(
        message,
        response.status,
        envelope.error?.code,
        envelope.error?.details ?? []
      );
    }

    return payload as T;
  }
}
