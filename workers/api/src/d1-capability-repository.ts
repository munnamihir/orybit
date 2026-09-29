import type {
  OrybitCapability
} from "@orybit/protocol";

import type {
  CapabilityRepository
} from "./capability-types.js";

import type {
  D1DatabaseLike
} from "./types.js";

interface CapabilityRow {
  name: string;
  protocol_version: "0.1";
  title: string;
  description: string;
  access: OrybitCapability["access"];
  requires_approval: number;
  category: string | null;
  operation_type: OrybitCapability["operation"] | null;
}

function rowToCapability(
  row: CapabilityRow
): OrybitCapability {
  return {
    protocolVersion: row.protocol_version,
    name: row.name,
    title: row.title,
    description: row.description,
    access: row.access,
    requiresApproval:
      row.requires_approval === 1,
    ...(row.category
      ? { category: row.category }
      : {}),
    ...(row.operation_type
      ? { operation: row.operation_type }
      : {})
  };
}

const selectColumns = `
  name,
  protocol_version,
  title,
  description,
  access,
  requires_approval,
  category,
  operation_type
`;

export class D1CapabilityRepository
implements CapabilityRepository {
  constructor(
    private readonly db: D1DatabaseLike
  ) {}

  async create(
    capability: OrybitCapability
  ): Promise<OrybitCapability> {
    if (await this.find(capability.name)) {
      throw new Error(
        "CAPABILITY_ALREADY_EXISTS"
      );
    }

    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        INSERT INTO capability_definitions (
          name,
          protocol_version,
          title,
          description,
          access,
          requires_approval,
          category,
          operation_type,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        capability.name,
        capability.protocolVersion,
        capability.title,
        capability.description,
        capability.access,
        capability.requiresApproval ? 1 : 0,
        capability.category ?? null,
        capability.operation ?? null,
        now,
        now
      )
      .run();

    if (!result.success) {
      throw new Error(
        "CAPABILITY_CREATE_FAILED"
      );
    }

    return capability;
  }

  async list(): Promise<OrybitCapability[]> {
    const result = await this.db
      .prepare(`
        SELECT ${selectColumns}
        FROM capability_definitions
        ORDER BY name ASC
      `)
      .all<CapabilityRow>();

    return (result.results ?? [])
      .map(rowToCapability);
  }

  async find(
    name: string
  ): Promise<OrybitCapability | null> {
    const row = await this.db
      .prepare(`
        SELECT ${selectColumns}
        FROM capability_definitions
        WHERE name = ?
        LIMIT 1
      `)
      .bind(name)
      .first<CapabilityRow>();

    return row
      ? rowToCapability(row)
      : null;
  }

  async update(
    name: string,
    capability: OrybitCapability
  ): Promise<OrybitCapability | null> {
    if (!(await this.find(name))) {
      return null;
    }

    if (name !== capability.name) {
      throw new Error(
        "CAPABILITY_NAME_IMMUTABLE"
      );
    }

    const result = await this.db
      .prepare(`
        UPDATE capability_definitions
        SET
          title = ?,
          description = ?,
          access = ?,
          requires_approval = ?,
          category = ?,
          operation_type = ?,
          updated_at = ?
        WHERE name = ?
      `)
      .bind(
        capability.title,
        capability.description,
        capability.access,
        capability.requiresApproval ? 1 : 0,
        capability.category ?? null,
        capability.operation ?? null,
        new Date().toISOString(),
        name
      )
      .run();

    if (!result.success) {
      throw new Error(
        "CAPABILITY_UPDATE_FAILED"
      );
    }

    return this.find(name);
  }
}
