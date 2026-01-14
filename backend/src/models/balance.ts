import { getDatabase } from '../db/index.js'
import type { BalanceRecord, BalanceRecordRow } from '../types/index.js'

function rowToBalanceRecord(row: BalanceRecordRow): BalanceRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    totalValue: row.total_value,
    cashBalance: row.cash_balance,
    portfolioValue: row.portfolio_value,
    asOfDate: new Date(row.as_of_date),
    fetchedAt: new Date(row.fetched_at),
  }
}

export interface CreateBalanceRecordInput {
  accountId: number
  totalValue: number
  cashBalance?: number | null
  portfolioValue?: number | null
  asOfDate: Date | string
}

export class BalanceRecordModel {
  static findById(id: number): BalanceRecord | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM balance_records WHERE id = ?').get(id) as
      | BalanceRecordRow
      | undefined
    return row ? rowToBalanceRecord(row) : null
  }

  static findByAccountId(accountId: number): BalanceRecord[] {
    const db = getDatabase()
    const rows = db
      .prepare('SELECT * FROM balance_records WHERE account_id = ? ORDER BY as_of_date DESC')
      .all(accountId) as BalanceRecordRow[]
    return rows.map(rowToBalanceRecord)
  }

  static getLatestForAccount(accountId: number): BalanceRecord | null {
    const db = getDatabase()
    const row = db
      .prepare(
        'SELECT * FROM balance_records WHERE account_id = ? ORDER BY as_of_date DESC LIMIT 1'
      )
      .get(accountId) as BalanceRecordRow | undefined
    return row ? rowToBalanceRecord(row) : null
  }

  static getAsOfDate(accountId: number, asOfDate: Date | string): BalanceRecord | null {
    const db = getDatabase()
    const dateStr = asOfDate instanceof Date ? asOfDate.toISOString().split('T')[0] : asOfDate

    const row = db
      .prepare(
        `SELECT * FROM balance_records
         WHERE account_id = ? AND as_of_date <= ?
         ORDER BY as_of_date DESC
         LIMIT 1`
      )
      .get(accountId, dateStr) as BalanceRecordRow | undefined

    return row ? rowToBalanceRecord(row) : null
  }

  static create(input: CreateBalanceRecordInput): BalanceRecord {
    const db = getDatabase()

    const asOfDateStr =
      input.asOfDate instanceof Date
        ? input.asOfDate.toISOString().split('T')[0]
        : input.asOfDate

    const stmt = db.prepare(`
      INSERT INTO balance_records (account_id, total_value, cash_balance, portfolio_value, as_of_date)
      VALUES (@accountId, @totalValue, @cashBalance, @portfolioValue, @asOfDate)
    `)

    const result = stmt.run({
      accountId: input.accountId,
      totalValue: input.totalValue,
      cashBalance: input.cashBalance ?? null,
      portfolioValue: input.portfolioValue ?? null,
      asOfDate: asOfDateStr,
    })

    return this.findById(result.lastInsertRowid as number)!
  }

  static upsert(input: CreateBalanceRecordInput): BalanceRecord {
    const db = getDatabase()

    const asOfDateStr =
      input.asOfDate instanceof Date
        ? input.asOfDate.toISOString().split('T')[0]
        : input.asOfDate

    const stmt = db.prepare(`
      INSERT INTO balance_records (account_id, total_value, cash_balance, portfolio_value, as_of_date)
      VALUES (@accountId, @totalValue, @cashBalance, @portfolioValue, @asOfDate)
      ON CONFLICT (account_id, as_of_date) DO UPDATE SET
        total_value = excluded.total_value,
        cash_balance = excluded.cash_balance,
        portfolio_value = excluded.portfolio_value,
        fetched_at = datetime('now')
    `)

    stmt.run({
      accountId: input.accountId,
      totalValue: input.totalValue,
      cashBalance: input.cashBalance ?? null,
      portfolioValue: input.portfolioValue ?? null,
      asOfDate: asOfDateStr,
    })

    // Get the record we just inserted/updated
    const row = db
      .prepare('SELECT * FROM balance_records WHERE account_id = ? AND as_of_date = ?')
      .get(input.accountId, asOfDateStr) as BalanceRecordRow

    return rowToBalanceRecord(row)
  }

  static delete(id: number): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM balance_records WHERE id = ?').run(id)
    return result.changes > 0
  }

  static deleteByAccountId(accountId: number): number {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM balance_records WHERE account_id = ?').run(accountId)
    return result.changes
  }
}
