import type {
  ApiResponse,
  InstitutionWithConnection,
  Connection,
  AccountWithBalance,
  DashboardReport,
  CreateConnectionRequest,
  CreateBalanceRequest,
  BalanceRecord,
  SyncResult,
  RefreshResult,
  HealthResponse,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    }))

    throw new ApiError(
      response.status,
      errorData.error || 'UNKNOWN_ERROR',
      errorData.message || 'An unexpected error occurred',
      errorData.details
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Health
export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

// Institutions
export async function getInstitutions(): Promise<ApiResponse<InstitutionWithConnection[]>> {
  return request<ApiResponse<InstitutionWithConnection[]>>('/institutions')
}

export async function getInstitution(id: string): Promise<InstitutionWithConnection> {
  return request<InstitutionWithConnection>(`/institutions/${id}`)
}

// Connections
export async function getConnections(): Promise<ApiResponse<Connection[]>> {
  return request<ApiResponse<Connection[]>>('/connections')
}

export async function createConnection(data: CreateConnectionRequest): Promise<Connection> {
  return request<Connection>('/connections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteConnection(id: number): Promise<void> {
  return request<void>(`/connections/${id}`, {
    method: 'DELETE',
  })
}

export async function syncConnection(id: number): Promise<SyncResult> {
  return request<SyncResult>(`/connections/${id}/sync`, {
    method: 'POST',
  })
}

// Accounts
export async function getAccounts(params?: {
  connectionId?: number
  institutionId?: string
}): Promise<ApiResponse<AccountWithBalance[]>> {
  const searchParams = new URLSearchParams()
  if (params?.connectionId) searchParams.set('connectionId', params.connectionId.toString())
  if (params?.institutionId) searchParams.set('institutionId', params.institutionId)

  const query = searchParams.toString()
  return request<ApiResponse<AccountWithBalance[]>>(`/accounts${query ? `?${query}` : ''}`)
}

export async function createBalance(
  accountId: number,
  data: CreateBalanceRequest
): Promise<BalanceRecord> {
  return request<BalanceRecord>(`/accounts/${accountId}/balances`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Dashboard
export async function getDashboard(params?: {
  asOfDate?: string
  institutionIds?: string[]
}): Promise<DashboardReport> {
  const searchParams = new URLSearchParams()
  if (params?.asOfDate) searchParams.set('asOfDate', params.asOfDate)
  if (params?.institutionIds?.length) {
    searchParams.set('institutionIds', params.institutionIds.join(','))
  }

  const query = searchParams.toString()
  return request<DashboardReport>(`/dashboard${query ? `?${query}` : ''}`)
}

export async function refreshDashboard(): Promise<RefreshResult> {
  return request<RefreshResult>('/dashboard/refresh', {
    method: 'POST',
  })
}

export async function exportDashboard(asOfDate?: string): Promise<Blob> {
  const searchParams = new URLSearchParams()
  if (asOfDate) searchParams.set('asOfDate', asOfDate)

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/dashboard/export${query ? `?${query}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new ApiError(response.status, 'EXPORT_ERROR', 'Failed to export dashboard')
  }

  return response.blob()
}
