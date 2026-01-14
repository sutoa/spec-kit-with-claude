import { ConnectionModel } from '../models/connection.js'
import { CredentialModel } from '../models/credential.js'
import { AccountModel } from '../models/account.js'
import { BalanceRecordModel } from '../models/balance.js'
import { InstitutionModel } from '../models/institution.js'
import * as snaptradeClient from './snaptrade/client.js'
import * as snaptradeAccounts from './snaptrade/accounts.js'
import * as snaptradeHoldings from './snaptrade/holdings.js'
import type { CredentialData, Connection } from '../types/index.js'
import type { SnaptradeUserCredentials } from './snaptrade/client.js'
import crypto from 'crypto'

export interface CreateConnectionParams {
  institutionId: string
  credentials: CredentialData
}

export interface SyncResult {
  connection: Connection
  accountsUpdated: number
  balancesUpdated: number
}

/**
 * Dependencies that can be injected for testing
 */
export interface ConnectionServiceDeps {
  registerSnaptradeUser?: (userId: string) => Promise<SnaptradeUserCredentials>
  deleteSnaptradeUser?: (userId: string) => Promise<void>
  getConnectionPortalUrl?: (userId: string, userSecret: string, broker?: string) => Promise<string>
  getAccounts?: (userId: string, userSecret: string) => Promise<any[]>
  getHoldings?: (userId: string, userSecret: string, accountId: string) => Promise<any[]>
}

// Global dependencies (can be overridden for testing)
let deps: ConnectionServiceDeps = {
  registerSnaptradeUser: snaptradeClient.registerSnaptradeUser,
  deleteSnaptradeUser: snaptradeClient.deleteSnaptradeUser,
  getConnectionPortalUrl: snaptradeClient.getConnectionPortalUrl,
  getAccounts: snaptradeAccounts.getAccounts,
  getHoldings: snaptradeHoldings.getHoldings,
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
    registerSnaptradeUser: snaptradeClient.registerSnaptradeUser,
    deleteSnaptradeUser: snaptradeClient.deleteSnaptradeUser,
    getConnectionPortalUrl: snaptradeClient.getConnectionPortalUrl,
    getAccounts: snaptradeAccounts.getAccounts,
    getHoldings: snaptradeHoldings.getHoldings,
  }
}

/**
 * ConnectionService handles the creation, management, and synchronization
 * of institution connections using SnapTrade
 */
export class ConnectionService {
  /**
   * Create a new connection to a financial institution
   */
  static async createConnection(params: CreateConnectionParams): Promise<Connection> {
    const { institutionId, credentials } = params

    // Validate institution exists
    const institution = InstitutionModel.findById(institutionId)
    if (!institution) {
      throw new Error(`Institution '${institutionId}' not found`)
    }

    // Check for existing connection
    const existing = ConnectionModel.findByInstitutionId(institutionId)
    if (existing) {
      throw new Error(`Connection to ${institution.name} already exists`)
    }

    // Generate a unique user ID for SnapTrade
    const snaptradeUserId = `user-${institutionId}-${crypto.randomUUID()}`

    try {
      // Register user with SnapTrade
      const snaptradeUser = await deps.registerSnaptradeUser!(snaptradeUserId)

      // Create connection record
      const connection = ConnectionModel.create({
        institutionId,
        status: 'connected',
        snaptradeUserId: snaptradeUser.userId,
        snaptradeUserSecret: snaptradeUser.userSecret,
      })

      // Store encrypted credentials
      CredentialModel.create(connection.id, credentials)

      return connection
    } catch (error) {
      // Clean up if SnapTrade registration fails
      console.error('Failed to create connection:', error)
      throw new Error('Failed to create connection with SnapTrade')
    }
  }

  /**
   * Get the SnapTrade connection portal URL for a connection
   */
  static async getConnectionPortalUrl(connectionId: number, broker?: string): Promise<string> {
    const connection = ConnectionModel.findById(connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    if (!connection.snaptradeUserId || !connection.snaptradeUserSecret) {
      throw new Error('Connection does not have SnapTrade credentials')
    }

    const url = await deps.getConnectionPortalUrl!(
      connection.snaptradeUserId,
      connection.snaptradeUserSecret,
      broker
    )

    return url
  }

  /**
   * Sync account data from SnapTrade for a connection
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

    if (!connection.snaptradeUserId || !connection.snaptradeUserSecret) {
      throw new Error('Connection does not have SnapTrade credentials')
    }

    try {
      // Fetch accounts from SnapTrade
      const snaptradeAccounts = await deps.getAccounts!(
        connection.snaptradeUserId,
        connection.snaptradeUserSecret
      )

      let accountsUpdated = 0
      let balancesUpdated = 0

      // Update or create accounts
      for (const snapAccount of snaptradeAccounts) {
        // Upsert account
        const account = AccountModel.upsert({
          connectionId: connection.id,
          externalId: snapAccount.id,
          accountNumberMasked: snapAccount.number || '•••• 0000',
          accountName: snapAccount.name || 'Account',
          accountType: snapAccount.type || null,
        })

        accountsUpdated++

        // Fetch holdings for this account
        const holdings = await deps.getHoldings!(
          connection.snaptradeUserId,
          connection.snaptradeUserSecret,
          snapAccount.id
        )

        // Calculate total value
        const totalValue = holdings.reduce((sum, holding) => {
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
      const updatedConnection = ConnectionModel.updateSyncStatus(
        connection.id,
        false,
        error instanceof Error ? error.message : 'Unknown sync error'
      )

      throw new Error(`Failed to sync ${institution.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a connection and clean up SnapTrade resources
   */
  static async deleteConnection(connectionId: number): Promise<void> {
    const connection = ConnectionModel.findById(connectionId)
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`)
    }

    try {
      // Delete SnapTrade user if exists
      if (connection.snaptradeUserId) {
        await deps.deleteSnaptradeUser!(connection.snaptradeUserId)
      }
    } catch (error) {
      // Log but don't fail if SnapTrade deletion fails
      console.warn('Failed to delete SnapTrade user:', error)
    }

    // Delete connection (cascades to credentials and accounts)
    ConnectionModel.delete(connectionId)
  }
}
