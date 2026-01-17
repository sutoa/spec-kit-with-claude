// Enums
export type InstitutionApiType = 'api' | 'manual'
export type InstitutionAuthType = 'api_key' | 'oauth' | 'credentials' | 'none'
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending'

// Base Entities
export interface Institution {
  id: string
  name: string
  logoUrl: string | null
  apiType: InstitutionApiType
  authType: InstitutionAuthType
}

export interface Connection {
  id: number
  institutionId: string
  status: ConnectionStatus
  lastSyncAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: number
  connectionId: number
  externalId: string
  accountNumberMasked: string
  accountName: string
  accountType: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BalanceRecord {
  id: number
  accountId: number
  totalValue: number
  cashBalance: number | null
  portfolioValue: number | null
  asOfDate: string
  fetchedAt: string
}

// API Response Types
export interface InstitutionWithConnection extends Institution {
  connection: Connection | null
  lastUpdatedRelative: string | null
}

export interface AccountWithBalance extends Account {
  latestBalance: BalanceRecord | null
  institution: Pick<Institution, 'id' | 'name'>
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

// API Request Types
export interface ApiKeyCredentials {
  type: 'api_key'
  apiKey: string
  apiSecret: string
}

export interface UsernamePasswordCredentials {
  type: 'credentials'
  username: string
  password: string
}

export type CredentialData = ApiKeyCredentials | UsernamePasswordCredentials

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

// API Response Wrappers
export interface ApiResponse<T> {
  data: T
}

export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>
}

// Sync Result Types
export interface SyncResult {
  connection: Connection
  accountsUpdated: number
  balancesUpdated: number
}

export interface RefreshResult {
  dashboard: DashboardReport
  syncResults: Array<{
    institutionId: string
    success: boolean
    error: string | null
  }>
}

// Health Check
export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
}

// OAuth Flow Types
export interface PortalUrlResponse {
  url: string
}

export interface ConnectionStatusResponse {
  id: number
  status: ConnectionStatus
  lastSyncAt: string | null
  errorMessage: string | null
  accountCount: number
}
