import { getDatabase } from '../db/index.js'
import type { Account, AccountRow, AccountWithBalance } from '../types/index.js'
import { BalanceRecordModel } from './balance.js'

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    connectionId: row.connection_id,
    externalId: row.external_id,
    accountNumberMasked: row.account_number_masked,
    accountName: row.account_name,
    accountType: row.account_type,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export interface CreateAccountInput {
  connectionId: number
  externalId: string
  accountNumberMasked: string
  accountName: string
  accountType?: string | null
}

export interface UpdateAccountInput {
  accountName?: string
  accountType?: string | null
  isActive?: boolean
}

export class AccountModel {
  static findAll(): Account[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM accounts ORDER BY account_name').all() as AccountRow[]
    return rows.map(rowToAccount)
  }

  static findById(id: number): Account | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as AccountRow | undefined
    return row ? rowToAccount(row) : null
  }

  static findByConnectionId(connectionId: number): Account[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM accounts WHERE connection_id = ? ORDER BY account_name')
      .all(connectionId) as AccountRow[]
    return rows.map(rowToAccount)
  }

  static findByExternalId(connectionId: number, externalId: string): Account | null {
    const db = getDatabase()
    const row = db
      .prepare('SELECT * FROM accounts WHERE connection_id = ? AND external_id = ?')
      .get(connectionId, externalId) as AccountRow | undefined
    return row ? rowToAccount(row) : null
  }

  static create(input: CreateAccountInput): Account {
    const db = getDatabase()

    const stmt = db.prepare(`
      INSERT INTO accounts (connection_id, external_id, account_number_masked, account_name, account_type)
      VALUES (@connectionId, @externalId, @accountNumberMasked, @accountName, @accountType)
    `)

    const result = stmt.run({
      connectionId: input.connectionId,
      externalId: input.externalId,
      accountNumberMasked: input.accountNumberMasked,
      accountName: input.accountName,
      accountType: input.accountType || null,
    })

    return this.findById(result.lastInsertRowid as number)!
  }

  static upsert(input: CreateAccountInput): Account {
    const existing = this.findByExternalId(input.connectionId, input.externalId)

    if (existing) {
      return this.update(existing.id, {
        accountName: input.accountName,
        accountType: input.accountType,
      })!
    }

    return this.create(input)
  }

  static update(id: number, input: UpdateAccountInput): Account | null {
    const db = getDatabase()

    const updates: string[] = []
    const params: Record<string, unknown> = { id }

    if (input.accountName !== undefined) {
      updates.push('account_name = @accountName')
      params.accountName = input.accountName
    }

    if (input.accountType !== undefined) {
      updates.push('account_type = @accountType')
      params.accountType = input.accountType
    }

    if (input.isActive !== undefined) {
      updates.push('is_active = @isActive')
      params.isActive = input.isActive ? 1 : 0
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    updates.push("updated_at = datetime('now')")

    const stmt = db.prepare(`
      UPDATE accounts
      SET ${updates.join(', ')}
      WHERE id = @id
    `)

    stmt.run(params)

    return this.findById(id)
  }

  static delete(id: number): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
    return result.changes > 0
  }

  static findAllWithBalances(): AccountWithBalance[] {
    const db = getDatabase()

    const query = `
      SELECT
        a.*,
        i.id as institution_id,
        i.name as institution_name
      FROM accounts a
      JOIN connections c ON a.connection_id = c.id
      JOIN institutions i ON c.institution_id = i.id
      WHERE a.is_active = 1
      ORDER BY i.name, a.account_name
    `

    interface AccountWithInstitutionRow extends AccountRow {
      institution_id: string
      institution_name: string
    }

    const rows = db.prepare(query).all() as AccountWithInstitutionRow[]

    return rows.map((row) => {
      const account = rowToAccount(row)
      const latestBalance = BalanceRecordModel.getLatestForAccount(account.id)

      return {
        ...account,
        latestBalance,
        institution: {
          id: row.institution_id,
          name: row.institution_name,
        },
      }
    })
  }
}
