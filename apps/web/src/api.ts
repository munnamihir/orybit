import type {
  AssignOwnershipInput,
  CapabilityDefinitionInput,
  CreateDeveloperApiKeyInput,
  CreateEventInput,
  CreateObjectInput,
  CreateOwnerInput,
  CreateOwnershipTransferInput,
  DeveloperApiKey,
  DeveloperApiKeySecret,
  HealthResponse,
  OrybitCapability,
  OrybitEvent,
  OrybitObject,
  OrybitOwner,
  OwnershipSnapshot,
  OwnershipTransfer,
  OwnershipTransferSecret,
  PublicTransferPreview,
  ResolvedObjectCapability,
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

  async listCapabilityDefinitions():
  Promise<OrybitCapability[]> {
    const response = await this.request<
      ApiListEnvelope<OrybitCapability>
    >("/v1/capabilities");

    return response.data;
  }

  async createCapabilityDefinition(
    input: CapabilityDefinitionInput
  ): Promise<OrybitCapability> {
    const response = await this.request<
      ApiEnvelope<OrybitCapability>
    >(
      "/v1/capabilities",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );

    return response.data;
  }

  async updateCapabilityDefinition(
    name: string,
    input: Partial<CapabilityDefinitionInput>
  ): Promise<OrybitCapability> {
    const response = await this.request<
      ApiEnvelope<OrybitCapability>
    >(
      `/v1/capabilities/${encodeURIComponent(
        name
      )}`,
      {
        method: "PATCH",
        body: JSON.stringify(input)
      }
    );

    return response.data;
  }

  async listObjectCapabilities(
    identifier: string
  ): Promise<ResolvedObjectCapability[]> {
    const response = await this.request<
      ApiListEnvelope<ResolvedObjectCapability>
    >(
      `/v1/objects/${encodeURIComponent(
        identifier
      )}/capabilities`
    );

    return response.data;
  }

  async enableObjectCapability(
    identifier: string,
    name: string
  ): Promise<{
    object: OrybitObject;
    capabilities: ResolvedObjectCapability[];
  }> {
    const response = await this.request<
      ApiEnvelope<{
        object: OrybitObject;
        capabilities: ResolvedObjectCapability[];
      }>
    >(
      `/v1/objects/${encodeURIComponent(
        identifier
      )}/capabilities/${encodeURIComponent(
        name
      )}`,
      { method: "PUT" }
    );

    return response.data;
  }

  async disableObjectCapability(
    identifier: string,
    name: string
  ): Promise<{
    object: OrybitObject;
    capabilities: ResolvedObjectCapability[];
  }> {
    const response = await this.request<
      ApiEnvelope<{
        object: OrybitObject;
        capabilities: ResolvedObjectCapability[];
      }>
    >(
      `/v1/objects/${encodeURIComponent(
        identifier
      )}/capabilities/${encodeURIComponent(
        name
      )}`,
      { method: "DELETE" }
    );

    return response.data;
  }

  async listObjectEvents(
    identifier: string
  ): Promise<OrybitEvent[]> {
    const response =
      await this.request<
        ApiListEnvelope<OrybitEvent>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}/events`
      );

    return response.data;
  }

  async createObjectEvent(
    identifier: string,
    input: CreateEventInput
  ): Promise<OrybitEvent> {
    const response =
      await this.request<
        ApiEnvelope<OrybitEvent>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}/events`,
        {
          method: "POST",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  async listOwners(): Promise<OrybitOwner[]> {
    const response =
      await this.request<
        ApiListEnvelope<OrybitOwner>
      >("/v1/owners");

    return response.data;
  }

  async createOwner(
    input: CreateOwnerInput
  ): Promise<OrybitOwner> {
    const response =
      await this.request<
        ApiEnvelope<OrybitOwner>
      >(
        "/v1/owners",
        {
          method: "POST",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  async getOwnership(
    identifier: string
  ): Promise<OwnershipSnapshot> {
    const response =
      await this.request<
        ApiEnvelope<OwnershipSnapshot>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}/ownership`
      );

    return response.data;
  }

  async assignOwnership(
    identifier: string,
    input: AssignOwnershipInput
  ) {
    const response =
      await this.request<
        ApiEnvelope<
          OwnershipSnapshot["history"][number]
        >
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}/ownership/assign`,
        {
          method: "POST",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  async createOwnershipTransfer(
    identifier: string,
    input: CreateOwnershipTransferInput
  ): Promise<OwnershipTransferSecret> {
    const response =
      await this.request<
        ApiEnvelope<OwnershipTransferSecret>
      >(
        `/v1/objects/${encodeURIComponent(
          identifier
        )}/ownership/transfers`,
        {
          method: "POST",
          body: JSON.stringify(input)
        }
      );

    return response.data;
  }

  async cancelOwnershipTransfer(
    transferId: string
  ): Promise<OwnershipTransfer> {
    const response =
      await this.request<
        ApiEnvelope<OwnershipTransfer>
      >(
        `/v1/ownership-transfers/${encodeURIComponent(
          transferId
        )}/cancel`,
        {
          method: "POST"
        }
      );

    return response.data;
  }

  async previewOwnershipTransfer(
    token: string
  ): Promise<PublicTransferPreview> {
    const response =
      await this.request<
        ApiEnvelope<PublicTransferPreview>
      >(
        "/public/ownership-transfers/preview",
        {
          method: "POST",
          body: JSON.stringify({ token })
        },
        false
      );

    return response.data;
  }

  async acceptOwnershipTransfer(
    token: string
  ): Promise<PublicTransferPreview> {
    const response =
      await this.request<
        ApiEnvelope<PublicTransferPreview>
      >(
        "/public/ownership-transfers/accept",
        {
          method: "POST",
          body: JSON.stringify({ token })
        },
        false
      );

    return response.data;
  }

  async listDeveloperApiKeys():
  Promise<DeveloperApiKey[]> {
    const response = await this.request<
      ApiListEnvelope<DeveloperApiKey>
    >("/v1/developer-keys");

    return response.data;
  }

  async createDeveloperApiKey(
    input: CreateDeveloperApiKeyInput
  ): Promise<DeveloperApiKeySecret> {
    const response = await this.request<
      ApiEnvelope<DeveloperApiKeySecret>
    >(
      "/v1/developer-keys",
      {
        method: "POST",
        body: JSON.stringify(input)
      }
    );

    return response.data;
  }

  async revokeDeveloperApiKey(
    id: string
  ): Promise<DeveloperApiKey> {
    const response = await this.request<
      ApiEnvelope<DeveloperApiKey>
    >(
      `/v1/developer-keys/${encodeURIComponent(
        id
      )}/revoke`,
      { method: "POST" }
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
