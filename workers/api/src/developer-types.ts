export const DEVELOPER_SCOPES = [
  "objects:read",
  "manifests:read",
  "capabilities:read"
] as const;

export type DeveloperScope =
  typeof DEVELOPER_SCOPES[number];

export interface DeveloperApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: DeveloperScope[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface DeveloperApiKeyRecord
extends DeveloperApiKey {
  tokenHash: string;
}

export interface CreateDeveloperApiKeyInput {
  name: string;
  scopes: DeveloperScope[];
}

export interface DeveloperApiKeySecret {
  key: DeveloperApiKey;
  apiKey: string;
}

export interface DeveloperApiKeyRepository {
  create(
    key: DeveloperApiKeyRecord
  ): Promise<DeveloperApiKeyRecord>;
  list(): Promise<DeveloperApiKeyRecord[]>;
  findById(
    id: string
  ): Promise<DeveloperApiKeyRecord | null>;
  resolve(
    id: string,
    tokenHash: string
  ): Promise<DeveloperApiKeyRecord | null>;
  touchLastUsed(
    id: string,
    usedAt: string
  ): Promise<void>;
  revoke(
    id: string,
    revokedAt: string
  ): Promise<DeveloperApiKeyRecord | null>;
}
