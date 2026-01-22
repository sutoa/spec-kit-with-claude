import type Database from 'better-sqlite3'

interface InstitutionSeed {
  id: string
  name: string
  logo_url: string | null
  api_type: 'api' | 'manual'
  api_base_url: string | null
  auth_type: 'api_key' | 'oauth' | 'credentials' | 'none'
}

const institutions: InstitutionSeed[] = [
  {
    id: 'alpaca-paper',
    name: 'Alpaca Paper',
    logo_url: '/logos/alpaca.png',
    api_type: 'api',
    api_base_url: 'https://paper-api.alpaca.markets',
    auth_type: 'oauth',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    logo_url: '/logos/vanguard.svg',
    api_type: 'api',
    api_base_url: null,
    auth_type: 'oauth',
  },
  {
    id: 'schwab',
    name: 'Schwab',
    logo_url: '/logos/schwab.svg',
    api_type: 'api',
    api_base_url: null,
    auth_type: 'oauth',
  },
  {
    id: 'chase',
    name: 'Chase',
    logo_url: '/logos/chase.svg',
    api_type: 'api',
    api_base_url: null,
    auth_type: 'oauth',
  },
]

export function seedInstitutions(db: Database.Database): void {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO institutions (id, name, logo_url, api_type, api_base_url, auth_type)
    VALUES (@id, @name, @logo_url, @api_type, @api_base_url, @auth_type)
  `)

  const insertMany = db.transaction((items: InstitutionSeed[]) => {
    for (const item of items) {
      insertStmt.run(item)
    }
  })

  insertMany(institutions)
}
