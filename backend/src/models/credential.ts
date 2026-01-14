import { getDatabase } from '../db/index.js'
import { encryptObject, decryptObject } from '../services/encryption.js'
import type { Credential, CredentialRow, CredentialData } from '../types/index.js'

function rowToCredential(row: CredentialRow): Credential {
  return {
    id: row.id,
    connectionId: row.connection_id,
    encryptedData: row.encrypted_data,
    iv: row.iv,
    authTag: row.auth_tag,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export class CredentialModel {
  static findByConnectionId(connectionId: number): Credential | null {
    const db = getDatabase()
    const row = db
      .prepare('SELECT * FROM credentials WHERE connection_id = ?')
      .get(connectionId) as CredentialRow | undefined

    return row ? rowToCredential(row) : null
  }

  static create(connectionId: number, data: CredentialData): Credential {
    const db = getDatabase()

    const encrypted = encryptObject(data)

    const stmt = db.prepare(`
      INSERT INTO credentials (connection_id, encrypted_data, iv, auth_tag)
      VALUES (@connectionId, @encryptedData, @iv, @authTag)
    `)

    const result = stmt.run({
      connectionId,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    })

    return this.findById(result.lastInsertRowid as number)!
  }

  static findById(id: number): Credential | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM credentials WHERE id = ?').get(id) as
      | CredentialRow
      | undefined

    return row ? rowToCredential(row) : null
  }

  static update(connectionId: number, data: CredentialData): Credential | null {
    const db = getDatabase()

    const encrypted = encryptObject(data)

    const stmt = db.prepare(`
      UPDATE credentials
      SET encrypted_data = @encryptedData, iv = @iv, auth_tag = @authTag, updated_at = datetime('now')
      WHERE connection_id = @connectionId
    `)

    stmt.run({
      connectionId,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    })

    return this.findByConnectionId(connectionId)
  }

  static delete(connectionId: number): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM credentials WHERE connection_id = ?').run(connectionId)
    return result.changes > 0
  }

  static decrypt(credential: Credential): CredentialData {
    return decryptObject<CredentialData>(
      credential.encryptedData,
      credential.iv,
      credential.authTag
    )
  }

  static getDecrypted(connectionId: number): CredentialData | null {
    const credential = this.findByConnectionId(connectionId)
    if (!credential) return null

    return this.decrypt(credential)
  }
}
