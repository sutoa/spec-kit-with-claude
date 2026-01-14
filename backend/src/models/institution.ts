import { getDatabase } from '../db/index.js'
import type { Institution, InstitutionRow, InstitutionWithConnection } from '../types/index.js'
import { ConnectionModel } from './connection.js'

function rowToInstitution(row: InstitutionRow): Institution {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    apiType: row.api_type as Institution['apiType'],
    apiBaseUrl: row.api_base_url,
    authType: row.auth_type as Institution['authType'],
  }
}

export class InstitutionModel {
  static findAll(): Institution[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM institutions ORDER BY name').all() as InstitutionRow[]
    return rows.map(rowToInstitution)
  }

  static findById(id: string): Institution | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM institutions WHERE id = ?').get(id) as
      | InstitutionRow
      | undefined
    return row ? rowToInstitution(row) : null
  }

  static findAllWithConnections(): InstitutionWithConnection[] {
    const institutions = this.findAll()

    return institutions.map((institution) => {
      const connection = ConnectionModel.findByInstitutionId(institution.id)

      let lastUpdatedRelative: string | null = null
      if (connection?.lastSyncAt) {
        lastUpdatedRelative = formatRelativeTime(connection.lastSyncAt)
      }

      return {
        ...institution,
        connection,
        lastUpdatedRelative,
      }
    })
  }

  static findByIdWithConnection(id: string): InstitutionWithConnection | null {
    const institution = this.findById(id)
    if (!institution) return null

    const connection = ConnectionModel.findByInstitutionId(id)

    let lastUpdatedRelative: string | null = null
    if (connection?.lastSyncAt) {
      lastUpdatedRelative = formatRelativeTime(connection.lastSyncAt)
    }

    return {
      ...institution,
      connection,
      lastUpdatedRelative,
    }
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
