import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { initSchema } from './schema.js'
import { seedInstitutions } from './seed.js'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(dbPath?: string): Database.Database {
  const databasePath = dbPath || process.env.DATABASE_PATH || './data/financial-hub.db'

  // Ensure the directory exists
  const dir = path.dirname(databasePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(databasePath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Initialize schema
  initSchema(db)

  // Seed initial data
  seedInstitutions(db)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
