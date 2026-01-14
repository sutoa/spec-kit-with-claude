import { getDatabase } from '../db/index.js'
import type { Connection, ConnectionRow, ConnectionStatus } from '../types/index.js'

function rowToConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    institutionId: row.institution_id,
    status: row.status as ConnectionStatus,
    lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
    errorMessage: row.error_message,
    snaptradeUserId: row.snaptrade_user_id,
    snaptradeUserSecret: row.snaptrade_user_secret,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export interface CreateConnectionInput {
  institutionId: string
  status?: ConnectionStatus
  snaptradeUserId?: string
  snaptradeUserSecret?: string
}

export interface UpdateConnectionInput {
  status?: ConnectionStatus
  lastSyncAt?: Date | null
  errorMessage?: string | null
  snaptradeUserId?: string | null
  snaptradeUserSecret?: string | null
}

export class ConnectionModel {
  static findAll(): Connection[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM connections ORDER BY created_at DESC')
      .all() as ConnectionRow[]
    return rows.map(rowToConnection)
  }

  static findById(id: number): Connection | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id) as
      | ConnectionRow
      | undefined
    return row ? rowToConnection(row) : null
  }

  static findByInstitutionId(institutionId: string): Connection | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM connections WHERE institution_id = ?').get(institutionId) as
      | ConnectionRow
      | undefined
    return row ? rowToConnection(row) : null
  }

  static create(input: CreateConnectionInput): Connection {
    const db = getDatabase()

    const stmt = db.prepare(`
      INSERT INTO connections (institution_id, status, snaptrade_user_id, snaptrade_user_secret)
      VALUES (@institutionId, @status, @snaptradeUserId, @snaptradeUserSecret)
    `)

    const result = stmt.run({
      institutionId: input.institutionId,
      status: input.status || 'disconnected',
      snaptradeUserId: input.snaptradeUserId || null,
      snaptradeUserSecret: input.snaptradeUserSecret || null,
    })

    return this.findById(result.lastInsertRowid as number)!
  }

  static update(id: number, input: UpdateConnectionInput): Connection | null {
    const db = getDatabase()

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (input.status !== undefined) {
      updates.push('status = @status')
      params.status = input.status
    }

    if (input.lastSyncAt !== undefined) {
      updates.push('last_sync_at = @lastSyncAt')
      params.lastSyncAt = input.lastSyncAt?.toISOString() || null
    }

    if (input.errorMessage !== undefined) {
      updates.push('error_message = @errorMessage')
      params.errorMessage = input.errorMessage
    }

    if (input.snaptradeUserId !== undefined) {
      updates.push('snaptrade_user_id = @snaptradeUserId')
      params.snaptradeUserId = input.snaptradeUserId
    }

    if (input.snaptradeUserSecret !== undefined) {
      updates.push('snaptrade_user_secret = @snaptradeUserSecret')
      params.snaptradeUserSecret = input.snaptradeUserSecret
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    updates.push("updated_at = datetime('now')")

    const stmt = db.prepare(`
      UPDATE connections
      SET ${updates.join(', ')}
      WHERE id = @id
    `)

    stmt.run(params)

    return this.findById(id)
  }

  static delete(id: number): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM connections WHERE id = ?').run(id)
    return result.changes > 0
  }

  static updateSyncStatus(
    id: number,
    success: boolean,
    errorMessage?: string
  ): Connection | null {
    return this.update(id, {
      status: success ? 'connected' : 'error',
      lastSyncAt: success ? new Date() : undefined,
      errorMessage: success ? null : errorMessage || 'Sync failed',
    })
  }
}
