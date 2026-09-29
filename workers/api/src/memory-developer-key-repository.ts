import type {
  DeveloperApiKeyRecord,
  DeveloperApiKeyRepository
} from "./developer-types.js";

export class MemoryDeveloperApiKeyRepository
implements DeveloperApiKeyRepository {
  private readonly keys =
    new Map<string, DeveloperApiKeyRecord>();

  async create(
    key: DeveloperApiKeyRecord
  ): Promise<DeveloperApiKeyRecord> {
    if (this.keys.has(key.id)) {
      throw new Error(
        "DEVELOPER_KEY_ALREADY_EXISTS"
      );
    }

    this.keys.set(
      key.id,
      structuredClone(key)
    );

    return structuredClone(key);
  }

  async list(): Promise<DeveloperApiKeyRecord[]> {
    return Array.from(this.keys.values())
      .map((key) => structuredClone(key))
      .sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
  }

  async findById(
    id: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const key = this.keys.get(id);
    return key
      ? structuredClone(key)
      : null;
  }

  async resolve(
    id: string,
    tokenHash: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const key = this.keys.get(id);

    if (
      !key ||
      key.tokenHash !== tokenHash ||
      key.revokedAt
    ) {
      return null;
    }

    return structuredClone(key);
  }

  async touchLastUsed(
    id: string,
    usedAt: string
  ): Promise<void> {
    const key = this.keys.get(id);

    if (!key) {
      return;
    }

    this.keys.set(
      id,
      {
        ...key,
        lastUsedAt: usedAt
      }
    );
  }

  async revoke(
    id: string,
    revokedAt: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const key = this.keys.get(id);

    if (!key) {
      return null;
    }

    const revoked = {
      ...key,
      revokedAt:
        key.revokedAt ?? revokedAt
    };

    this.keys.set(id, revoked);
    return structuredClone(revoked);
  }
}
