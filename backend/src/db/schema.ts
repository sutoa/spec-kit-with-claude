import type Database from 'better-sqlite3'

export function initSchema(db: Database.Database): void {
  // Reference data - supported institutions
  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      api_type TEXT NOT NULL CHECK (api_type IN ('api', 'manual')),
      api_base_url TEXT,
      auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth', 'credentials', 'none'))
    )
  `)

  // User connections to institutions
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id TEXT NOT NULL UNIQUE REFERENCES institutions(id),
      status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
      last_sync_at TEXT,
      error_message TEXT,
      snaptrade_user_id TEXT,
      snaptrade_user_secret TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Encrypted credentials storage
  db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER NOT NULL UNIQUE REFERENCES connections(id) ON DELETE CASCADE,
      encrypted_data BLOB NOT NULL,
      iv BLOB NOT NULL,
      auth_tag BLOB NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Financial accounts
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      account_number_masked TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (connection_id, external_id)
    )
  `)

  // Balance history records
  db.exec(`
    CREATE TABLE IF NOT EXISTS balance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      total_value REAL NOT NULL CHECK (total_value >= 0),
      cash_balance REAL,
      portfolio_value REAL,
      as_of_date TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (account_id, as_of_date)
    )
  `)

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_balance_records_account_date
    ON balance_records(account_id, as_of_date DESC)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_accounts_connection
    ON accounts(connection_id)
  `)
}
