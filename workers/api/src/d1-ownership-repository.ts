import {
  generateOwnershipId,
  generateTransferId
} from "./ownership-ids.js";

import type {
  D1DatabaseLike,
  OrybitOwner,
  OwnerType,
  OwnershipRecord,
  OwnershipRepository,
  OwnershipSnapshot,
  OwnershipSource,
  OwnershipTransfer,
  OwnershipTransferStatus
} from "./types.js";

interface OwnerRow {
  id: string;
  display_name: string;
  owner_type: string;
  reference: string | null;
  created_at: string;
}

interface OwnershipRow {
  id: string;
  object_id: string;
  started_at: string;
  ended_at: string | null;
  source: string;
  note: string | null;
  owner_id: string;
  owner_display_name: string;
  owner_type: string;
  owner_reference: string | null;
  owner_created_at: string;
}

interface TransferRow {
  id: string;
  object_id: string;
  status: string;
  requested_at: string;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  note: string | null;
  from_owner_id: string;
  from_display_name: string;
  from_owner_type: string;
  from_reference: string | null;
  from_created_at: string;
  to_owner_id: string;
  to_display_name: string;
  to_owner_type: string;
  to_reference: string | null;
  to_created_at: string;
}

function ownerFromRow(row: OwnerRow): OrybitOwner {
  return {
    id: row.id,
    displayName: row.display_name,
    type: row.owner_type as OwnerType,
    ...(row.reference
      ? { reference: row.reference }
      : {}),
    createdAt: row.created_at
  };
}

function ownerFromOwnershipRow(
  row: OwnershipRow
): OrybitOwner {
  return {
    id: row.owner_id,
    displayName: row.owner_display_name,
    type: row.owner_type as OwnerType,
    ...(row.owner_reference
      ? { reference: row.owner_reference }
      : {}),
    createdAt: row.owner_created_at
  };
}

function recordFromRow(
  row: OwnershipRow
): OwnershipRecord {
  return {
    id: row.id,
    objectId: row.object_id,
    owner: ownerFromOwnershipRow(row),
    startedAt: row.started_at,
    ...(row.ended_at
      ? { endedAt: row.ended_at }
      : {}),
    source: row.source as OwnershipSource,
    ...(row.note ? { note: row.note } : {})
  };
}

function transferFromRow(
  row: TransferRow
): OwnershipTransfer {
  return {
    id: row.id,
    objectId: row.object_id,
    fromOwner: {
      id: row.from_owner_id,
      displayName: row.from_display_name,
      type: row.from_owner_type as OwnerType,
      ...(row.from_reference
        ? { reference: row.from_reference }
        : {}),
      createdAt: row.from_created_at
    },
    toOwner: {
      id: row.to_owner_id,
      displayName: row.to_display_name,
      type: row.to_owner_type as OwnerType,
      ...(row.to_reference
        ? { reference: row.to_reference }
        : {}),
      createdAt: row.to_created_at
    },
    status:
      row.status as OwnershipTransferStatus,
    requestedAt: row.requested_at,
    expiresAt: row.expires_at,
    ...(row.accepted_at
      ? { acceptedAt: row.accepted_at }
      : {}),
    ...(row.cancelled_at
      ? { cancelledAt: row.cancelled_at }
      : {}),
    ...(row.note ? { note: row.note } : {})
  };
}

const ownershipSelect = `
  SELECT
    r.id,
    r.object_id,
    r.started_at,
    r.ended_at,
    r.source,
    r.note,
    o.id AS owner_id,
    o.display_name AS owner_display_name,
    o.owner_type AS owner_type,
    o.reference AS owner_reference,
    o.created_at AS owner_created_at
  FROM ownership_records r
  INNER JOIN owners o
    ON o.id = r.owner_id
`;

const transferSelect = `
  SELECT
    t.id,
    t.object_id,
    t.status,
    t.requested_at,
    t.expires_at,
    t.accepted_at,
    t.cancelled_at,
    t.note,
    from_owner.id AS from_owner_id,
    from_owner.display_name AS from_display_name,
    from_owner.owner_type AS from_owner_type,
    from_owner.reference AS from_reference,
    from_owner.created_at AS from_created_at,
    to_owner.id AS to_owner_id,
    to_owner.display_name AS to_display_name,
    to_owner.owner_type AS to_owner_type,
    to_owner.reference AS to_reference,
    to_owner.created_at AS to_created_at
  FROM ownership_transfers t
  INNER JOIN owners from_owner
    ON from_owner.id = t.from_owner_id
  INNER JOIN owners to_owner
    ON to_owner.id = t.to_owner_id
`;

export class D1OwnershipRepository
implements OwnershipRepository {
  constructor(
    private readonly db: D1DatabaseLike
  ) {}

  async createOwner(
    owner: OrybitOwner
  ): Promise<OrybitOwner> {
    await this.db.prepare(`
      INSERT INTO owners (
        id,
        display_name,
        owner_type,
        reference,
        created_at
      ) VALUES (?, ?, ?, ?, ?)
    `)
      .bind(
        owner.id,
        owner.displayName,
        owner.type,
        owner.reference ?? null,
        owner.createdAt
      )
      .run();

    return structuredClone(owner);
  }

  async listOwners(): Promise<OrybitOwner[]> {
    const result = await this.db.prepare(`
      SELECT
        id,
        display_name,
        owner_type,
        reference,
        created_at
      FROM owners
      ORDER BY display_name COLLATE NOCASE ASC
    `).all<OwnerRow>();

    return (result.results ?? [])
      .map(ownerFromRow);
  }

  async getSnapshot(
    objectId: string,
    now = new Date().toISOString()
  ): Promise<OwnershipSnapshot> {
    await this.expireTransfers(objectId, now);

    const historyResult = await this.db
      .prepare(`${ownershipSelect}
        WHERE r.object_id = ?
        ORDER BY r.started_at DESC
      `)
      .bind(objectId)
      .all<OwnershipRow>();

    const transferResult = await this.db
      .prepare(`${transferSelect}
        WHERE t.object_id = ?
        ORDER BY t.requested_at DESC
      `)
      .bind(objectId)
      .all<TransferRow>();

    const history =
      (historyResult.results ?? [])
        .map(recordFromRow);

    return {
      current:
        history.find(
          (record) => !record.endedAt
        ) ?? null,
      history,
      transfers:
        (transferResult.results ?? [])
          .map(transferFromRow)
    };
  }

  async assignInitial(
    objectId: string,
    ownerId: string,
    startedAt: string,
    note?: string
  ): Promise<OwnershipRecord> {
    const owner = await this.findOwner(ownerId);

    if (!owner) {
      throw new Error("OWNER_NOT_FOUND");
    }

    const current =
      await this.findCurrentRecord(objectId);

    if (current) {
      throw new Error("OBJECT_ALREADY_OWNED");
    }

    const id = generateOwnershipId();

    await this.db.prepare(`
      INSERT INTO ownership_records (
        id,
        object_id,
        owner_id,
        started_at,
        source,
        note
      ) VALUES (?, ?, ?, ?, 'assigned', ?)
    `)
      .bind(
        id,
        objectId,
        ownerId,
        startedAt,
        note ?? null
      )
      .run();

    return {
      id,
      objectId,
      owner,
      startedAt,
      source: "assigned",
      ...(note ? { note } : {})
    };
  }

  async createTransfer(
    objectId: string,
    toOwnerId: string,
    tokenHash: string,
    requestedAt: string,
    expiresAt: string,
    note?: string
  ): Promise<OwnershipTransfer> {
    await this.expireTransfers(
      objectId,
      requestedAt
    );

    const current =
      await this.findCurrentRecord(objectId);

    if (!current) {
      throw new Error("OBJECT_HAS_NO_OWNER");
    }

    const toOwner = await this.findOwner(
      toOwnerId
    );

    if (!toOwner) {
      throw new Error("OWNER_NOT_FOUND");
    }

    if (current.owner.id === toOwnerId) {
      throw new Error("TRANSFER_TO_CURRENT_OWNER");
    }

    const pending = await this.db.prepare(`
      SELECT id
      FROM ownership_transfers
      WHERE object_id = ?
        AND status = 'pending'
      LIMIT 1
    `)
      .bind(objectId)
      .first<{ id: string }>();

    if (pending) {
      throw new Error("PENDING_TRANSFER_EXISTS");
    }

    const id = generateTransferId();

    await this.db.prepare(`
      INSERT INTO ownership_transfers (
        id,
        object_id,
        from_owner_id,
        to_owner_id,
        token_hash,
        status,
        requested_at,
        expires_at,
        note
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `)
      .bind(
        id,
        objectId,
        current.owner.id,
        toOwnerId,
        tokenHash,
        requestedAt,
        expiresAt,
        note ?? null
      )
      .run();

    return {
      id,
      objectId,
      fromOwner: current.owner,
      toOwner,
      status: "pending",
      requestedAt,
      expiresAt,
      ...(note ? { note } : {})
    };
  }

  async resolveTransfer(
    tokenHash: string,
    now = new Date().toISOString()
  ): Promise<OwnershipTransfer | null> {
    await this.db.prepare(`
      UPDATE ownership_transfers
      SET status = 'expired'
      WHERE token_hash = ?
        AND status = 'pending'
        AND expires_at <= ?
    `)
      .bind(tokenHash, now)
      .run();

    const row = await this.db
      .prepare(`${transferSelect}
        WHERE t.token_hash = ?
        LIMIT 1
      `)
      .bind(tokenHash)
      .first<TransferRow>();

    return row
      ? transferFromRow(row)
      : null;
  }

  async acceptTransfer(
    tokenHash: string,
    acceptedAt: string
  ): Promise<OwnershipTransfer> {
    const transfer = await this.resolveTransfer(
      tokenHash,
      acceptedAt
    );

    if (!transfer) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    if (transfer.status !== "pending") {
      throw new Error("TRANSFER_NOT_PENDING");
    }

    const current = await this.findCurrentRecord(
      transfer.objectId
    );

    if (
      !current ||
      current.owner.id !== transfer.fromOwner.id
    ) {
      throw new Error("OWNERSHIP_CHANGED");
    }

    const ownershipId = generateOwnershipId();

    await this.db.batch([
      this.db.prepare(`
        UPDATE ownership_records
        SET ended_at = ?
        WHERE object_id = ?
          AND owner_id = ?
          AND ended_at IS NULL
      `).bind(
        acceptedAt,
        transfer.objectId,
        transfer.fromOwner.id
      ),
      this.db.prepare(`
        INSERT INTO ownership_records (
          id,
          object_id,
          owner_id,
          started_at,
          source,
          note
        ) VALUES (?, ?, ?, ?, 'transfer', ?)
      `).bind(
        ownershipId,
        transfer.objectId,
        transfer.toOwner.id,
        acceptedAt,
        transfer.note ?? null
      ),
      this.db.prepare(`
        UPDATE ownership_transfers
        SET status = 'accepted',
            accepted_at = ?
        WHERE id = ?
          AND status = 'pending'
      `).bind(
        acceptedAt,
        transfer.id
      )
    ]);

    return {
      ...transfer,
      status: "accepted",
      acceptedAt
    };
  }

  async cancelTransfer(
    transferId: string,
    cancelledAt: string
  ): Promise<OwnershipTransfer> {
    const row = await this.db
      .prepare(`${transferSelect}
        WHERE t.id = ?
        LIMIT 1
      `)
      .bind(transferId)
      .first<TransferRow>();

    if (!row) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    const transfer = transferFromRow(row);

    if (transfer.status !== "pending") {
      throw new Error("TRANSFER_NOT_PENDING");
    }

    await this.db.prepare(`
      UPDATE ownership_transfers
      SET status = 'cancelled',
          cancelled_at = ?
      WHERE id = ?
        AND status = 'pending'
    `)
      .bind(cancelledAt, transferId)
      .run();

    return {
      ...transfer,
      status: "cancelled",
      cancelledAt
    };
  }

  private async findOwner(
    ownerId: string
  ): Promise<OrybitOwner | null> {
    const row = await this.db.prepare(`
      SELECT
        id,
        display_name,
        owner_type,
        reference,
        created_at
      FROM owners
      WHERE id = ?
      LIMIT 1
    `)
      .bind(ownerId)
      .first<OwnerRow>();

    return row ? ownerFromRow(row) : null;
  }

  private async findCurrentRecord(
    objectId: string
  ): Promise<OwnershipRecord | null> {
    const row = await this.db
      .prepare(`${ownershipSelect}
        WHERE r.object_id = ?
          AND r.ended_at IS NULL
        LIMIT 1
      `)
      .bind(objectId)
      .first<OwnershipRow>();

    return row ? recordFromRow(row) : null;
  }

  private async expireTransfers(
    objectId: string,
    now: string
  ): Promise<void> {
    await this.db.prepare(`
      UPDATE ownership_transfers
      SET status = 'expired'
      WHERE object_id = ?
        AND status = 'pending'
        AND expires_at <= ?
    `)
      .bind(objectId, now)
      .run();
  }
}
