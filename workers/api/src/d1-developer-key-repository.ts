import type {
  DeveloperApiKeyRecord,
  DeveloperApiKeyRepository,
  DeveloperScope
} from "./developer-types.js";

import type {
  D1DatabaseLike
} from "./types.js";

interface DeveloperKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  token_hash: string;
  scopes_json: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function rowToKey(
  row: DeveloperKeyRow
): DeveloperApiKeyRecord {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    tokenHash: row.token_hash,
    scopes:
      JSON.parse(row.scopes_json) as DeveloperScope[],
    createdAt: row.created_at,
    ...(row.last_used_at
      ? { lastUsedAt: row.last_used_at }
      : {}),
    ...(row.revoked_at
      ? { revokedAt: row.revoked_at }
      : {})
  };
}

const columns = `
  id,
  name,
  key_prefix,
  token_hash,
  scopes_json,
  created_at,
  last_used_at,
  revoked_at
`;

export class D1DeveloperApiKeyRepository
implements DeveloperApiKeyRepository {
  constructor(
    private readonly db: D1DatabaseLike
  ) {}

  async create(
    key: DeveloperApiKeyRecord
  ): Promise<DeveloperApiKeyRecord> {
    const result = await this.db
      .prepare(`
        INSERT INTO developer_api_keys (
          id,
          name,
          key_prefix,
          token_hash,
          scopes_json,
          created_at,
          last_used_at,
          revoked_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        key.id,
        key.name,
        key.keyPrefix,
        key.tokenHash,
        JSON.stringify(key.scopes),
        key.createdAt,
        key.lastUsedAt ?? null,
        key.revokedAt ?? null
      )
      .run();

    if (!result.success) {
      throw new Error(
        "DEVELOPER_KEY_CREATE_FAILED"
      );
    }

    return key;
  }

  async list(): Promise<DeveloperApiKeyRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT ${columns}
        FROM developer_api_keys
        ORDER BY created_at DESC
      `)
      .all<DeveloperKeyRow>();

    return (result.results ?? [])
      .map(rowToKey);
  }

  async findById(
    id: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const row = await this.db
      .prepare(`
        SELECT ${columns}
        FROM developer_api_keys
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<DeveloperKeyRow>();

    return row
      ? rowToKey(row)
      : null;
  }

  async resolve(
    id: string,
    tokenHash: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const row = await this.db
      .prepare(`
        SELECT ${columns}
        FROM developer_api_keys
        WHERE id = ?
          AND token_hash = ?
          AND revoked_at IS NULL
        LIMIT 1
      `)
      .bind(id, tokenHash)
      .first<DeveloperKeyRow>();

    return row
      ? rowToKey(row)
      : null;
  }

  async touchLastUsed(
    id: string,
    usedAt: string
  ): Promise<void> {
    await this.db
      .prepare(`
        UPDATE developer_api_keys
        SET last_used_at = ?
        WHERE id = ?
          AND revoked_at IS NULL
      `)
      .bind(usedAt, id)
      .run();
  }

  async revoke(
    id: string,
    revokedAt: string
  ): Promise<DeveloperApiKeyRecord | null> {
    const existing =
      await this.findById(id);

    if (!existing) {
      return null;
    }

    if (!existing.revokedAt) {
      await this.db
        .prepare(`
          UPDATE developer_api_keys
          SET revoked_at = ?
          WHERE id = ?
        `)
        .bind(revokedAt, id)
        .run();
    }

    return this.findById(id);
  }
}
