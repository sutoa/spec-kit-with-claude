// Enums
export type InstitutionApiType = 'api' | 'manual'
export type InstitutionAuthType = 'api_key' | 'oauth' | 'credentials' | 'none'
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending'

// Database Entities
export interface Institution {
  id: string
  name: string
  logoUrl: string | null
  apiType: InstitutionApiType
  apiBaseUrl: string | null
  authType: InstitutionAuthType
}

export interface Connection {
  id: number
  institutionId: string
  status: ConnectionStatus
  lastSyncAt: Date | null
  errorMessage: string | null
  snaptradeUserId: string | null
  snaptradeUserSecret: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Credential {
  id: number
  connectionId: number
  encryptedData: Buffer
  iv: Buffer
  authTag: Buffer
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: number
  connectionId: number
  externalId: string
  accountNumberMasked: string
  accountName: string
  accountType: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BalanceRecord {
  id: number
  accountId: number
  totalValue: number
  cashBalance: number | null
  portfolioValue: number | null
  asOfDate: Date
  fetchedAt: Date
}

// Credential Data Types (for encryption/decryption)
export interface ApiKeyCredential {
  type: 'api_key'
  apiKey: string
  apiSecret: string
}

export interface UsernamePasswordCredential {
  type: 'credentials'
  username: string
  password: string
}

export type CredentialData = ApiKeyCredential | UsernamePasswordCredential

// API Response Types
export interface InstitutionWithConnection extends Institution {
  connection: Connection | null
  lastUpdatedRelative: string | null
}

export interface AccountWithBalance extends Account {
  latestBalance: BalanceRecord | null
  institution: Pick<Institution, 'id' | 'name'>
}

export interface AccountWithBalanceHistory extends AccountWithBalance {
  balanceHistory: BalanceRecord[]
}

// Dashboard Types
export interface DashboardReport {
  asOfDate: string | null
  grandTotal: number
  totalInstitutions: number
  institutions: InstitutionSummary[]
}

export interface InstitutionSummary {
  institutionId: string
  institutionName: string
  logoUrl: string | null
  subTotal: number
  accounts: AccountBalance[]
}

export interface AccountBalance {
  accountId: number
  accountName: string
  accountNumberMasked: string
  totalValue: number
  asOfDate: string
}

// Brokerage Types (from SnapTrade)
export interface Brokerage {
  id: string
  name: string
  slug: string
  isConnected: boolean
}

// API Request Types
export interface CreateConnectionRequest {
  institutionId: string
  credentials?: CredentialData
}

export interface CreateBalanceRequest {
  totalValue: number
  cashBalance?: number | null
  portfolioValue?: number | null
  asOfDate: string
}

// Database Row Types (raw from SQLite)
export interface InstitutionRow {
  id: string
  name: string
  logo_url: string | null
  api_type: string
  api_base_url: string | null
  auth_type: string
}

export interface ConnectionRow {
  id: number
  institution_id: string
  status: string
  last_sync_at: string | null
  error_message: string | null
  snaptrade_user_id: string | null
  snaptrade_user_secret: string | null
  created_at: string
  updated_at: string
}

export interface AccountRow {
  id: number
  connection_id: number
  external_id: string
  account_number_masked: string
  account_name: string
  account_type: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface BalanceRecordRow {
  id: number
  account_id: number
  total_value: number
  cash_balance: number | null
  portfolio_value: number | null
  as_of_date: string
  fetched_at: string
}

export interface CredentialRow {
  id: number
  connection_id: number
  encrypted_data: Buffer
  iv: Buffer
  auth_tag: Buffer
  created_at: string
  updated_at: string
}
