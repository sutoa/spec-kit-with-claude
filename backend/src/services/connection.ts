import { ConnectionModel } from '../models/connection.js'
import { CredentialModel } from '../models/credential.js'
import { AccountModel } from '../models/account.js'
import { BalanceRecordModel } from '../models/balance.js'
import { InstitutionModel } from '../models/institution.js'
import * as snaptradeClient from './snaptrade/client.js'
import * as snaptradeAccounts from './snaptrade/accounts.js'
import * as snaptradeHoldings from './snaptrade/holdings.js'
import type { CredentialData, Connection } from '../types/index.js'
import type { SnaptradeAccountHoldings } from './snaptrade/holdings.js'

export interface CreateConnectionParams {
  institutionId: string
  credentials?: CredentialData
}

export interface SyncResult {
  connection: Connection
  accountsUpdated: number
  balancesUpdated: number
}

/**
 * Get fixed SnapTrade user credentials from environment variables
 * For MVP single-user mode, all connections share the same SnapTrade user
 */
function getFixedSnaptradeCredentials(): { userId: string; userSecret: string } {
  const userId = process.env.SNAPTRADE_USER_ID
  const userSecret = process.env.SNAPTRADE_USER_SECRET

  if (!userId || !userSecret || userId === 'your-user-id-here' || userSecret === 'your-user-secret-here') {
    throw new Error(
      'SnapTrade user credentials not configured. ' +
      'Please set SNAPTRADE_USER_ID and SNAPTRADE_USER_SECRET in backend/.env'
    )
  }

  return { userId, userSecret }
}

/**
 * Dependencies that can be injected for testing
 */
export interface ConnectionServiceDeps {
  getConnectionPortalUrl?: (userId: string, userSecret: string, broker?: string) => Promise<string>
  getAccounts?: (userId: string, userSecret: string) => Promise<any[]>
  getHoldings?: (userId: string, userSecret: string, accountId: string) => Promise<SnaptradeAccountHoldings>
  getFixedCredentials?: () => { userId: string; userSecret: string }
}

// Global dependencies (can be overridden for testing)
let deps: ConnectionServiceDeps = {
  getConnectionPortalUrl: snaptradeClient.getConnectionPortalUrl,
  getAccounts: snaptradeAccounts.listUserAccounts,
  getHoldings: snaptradeHoldings.getAccountHoldings,
  getFixedCredentials: getFixedSnaptradeCredentials,
}

/**
 * Set dependencies (for testing)
 */
export function setConnectionServiceDeps(newDeps: Partial<ConnectionServiceDeps>) {
  deps = { ...deps, ...newDeps }
}

/**
 * Reset dependencies to defaults
 */
export function resetConnectionServiceDeps() {
  deps = {
    getConnectionPortalUrl: snaptradeClient.getConnectionPortalUrl,
    getAccounts: snaptradeAccounts.listUserAccounts,
    getHoldings: snaptradeHoldings.getAccountHoldings,
    getFixedCredentials: getFixedSnaptradeCredentials,
  }
}

/**
 * ConnectionService handles the creation, management, and synchronization
 * of institution connections using SnapTrade.
 *
 * MVP Mode: Uses a fixed SnapTrade user ID and secret from environment variables.
 * All connections share the same SnapTrade user for simplicity.
 */
export class ConnectionService {
  /**
   * Create a new connection to a financial institution.
   * Uses fixed SnapTrade user credentials from environment variables.
   */
  static async createConnection(params: CreateConnectionParams): Promise<Connection> {
    const { institutionId, credentials } = params

    // Validate institution exists (should already be created by the API route)
    const institution = InstitutionModel.findById(institutionId)
    if (!institution) {
      throw new Error(`Institution '${institutionId}' not found. Please create it via the connections API.`)
    }

    // Check for existing connection
    const existing = ConnectionModel.findByInstitutionId(institutionId)
    if (existing) {
      throw new Error(`Connection to ${institution.name} already exists`)
    }

    // Validate fixed SnapTrade credentials are configured
    const fixedCreds = deps.getFixedCredentials!()

    // Create connection record with 'pending' status (user hasn't completed OAuth yet)
    // Note: We don't store SnapTrade credentials in the connection anymore
    // since all connections use the same fixed user from environment
    const connection = ConnectionModel.create({
      institutionId,
      status: 'pending',
      // snaptradeUserId and snaptradeUserSecret are not needed - using fixed env credentials
    })

    // Store encrypted credentials only if provided (not needed for OAuth)
    if (credentials) {
      CredentialModel.create(connection.id, credentials)
    }

    return connection
  }

  /**
   * Get the SnapTrade connection portal URL for a connection.
   * Uses fixed SnapTrade user credentials from environment variables.
   */
  static async getConnectionPortalUrl(connectionId: number, broker?: string): Promise<string> {
    const connection = ConnectionModel.findById(connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    // Use fixed credentials from environment
    const { userId, userSecret } = deps.getFixedCredentials!()

    const url = await deps.getConnectionPortalUrl!(userId, userSecret, broker)

    return url
  }

  /**
   * Sync account data from SnapTrade for a connection.
   * Uses fixed SnapTrade user credentials from environment variables.
   */
  static async syncConnection(connectionId: number): Promise<SyncResult> {
    const connection = ConnectionModel.findById(connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    const institution = InstitutionModel.findById(connection.institutionId)
    if (!institution) {
      throw new Error(`Institution ${connection.institutionId} not found`)
    }

    // Check if institution supports API sync
    if (institution.apiType !== 'api') {
      throw new Error(`Sync is not supported for ${institution.name} (manual institution)`)
    }

    // Use fixed credentials from environment
    const { userId, userSecret } = deps.getFixedCredentials!()

    try {
      // Fetch accounts from SnapTrade
      const snaptradeAccountsList = await deps.getAccounts!(userId, userSecret)

      let accountsUpdated = 0
      let balancesUpdated = 0

      // Update or create accounts
      for (const snapAccount of snaptradeAccountsList) {
        // Upsert account
        const account = AccountModel.upsert({
          connectionId: connection.id,
          externalId: snapAccount.id,
          accountNumberMasked: snapAccount.number || '.... 0000',
          accountName: snapAccount.name || 'Account',
          accountType: snapAccount.type || null,
        })

        accountsUpdated++

        // Fetch holdings for this account
        const holdingsData = await deps.getHoldings!(userId, userSecret, snapAccount.id)

        // Calculate total value from holdings
        const totalValue = holdingsData.holdings.reduce((sum, holding) => {
          const value = holding.price * holding.units
          return sum + value
        }, 0)

        const cashBalance = snapAccount.balance?.cash || null
        const portfolioValue = totalValue

        // Create balance record
        BalanceRecordModel.upsert({
          accountId: account.id,
          totalValue: cashBalance !== null ? cashBalance + portfolioValue : portfolioValue,
          cashBalance,
          portfolioValue,
          asOfDate: new Date(),
        })

        balancesUpdated++
      }

      // Update connection sync status
      const updatedConnection = ConnectionModel.updateSyncStatus(connection.id, true)

      return {
        connection: updatedConnection!,
        accountsUpdated,
        balancesUpdated,
      }
    } catch (error) {
      console.error('Sync failed:', error)

      // Update connection with error status
      ConnectionModel.updateSyncStatus(
        connection.id,
        false,
        error instanceof Error ? error.message : 'Unknown sync error'
      )

      throw new Error(`Failed to sync ${institution.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a connection.
   * Note: Does NOT delete the SnapTrade user since it's shared across all connections.
   */
  static async deleteConnection(connectionId: number): Promise<void> {
    const connection = ConnectionModel.findById(connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    // Note: We do NOT delete the SnapTrade user because:
    // 1. It's a fixed user shared across all connections
    // 2. Deleting it would break other connections
    // The brokerage authorization within SnapTrade will be managed separately if needed

    // Delete connection (cascades to credentials and accounts)
    ConnectionModel.delete(connectionId)
  }
}
