import { ConnectionModel } from '../models/connection.js'
import { InstitutionModel } from '../models/institution.js'
import { AccountModel } from '../models/account.js'
import { BalanceRecordModel } from '../models/balance.js'
import { ConnectionService } from './connection.js'
import type { DashboardReport, InstitutionSummary } from '../types/index.js'

export interface DashboardOptions {
  asOfDate?: string
  institutionIds?: string[]
}

export interface RefreshResult {
  dashboard: DashboardReport
  syncResults: Array<{
    institutionId: string
    success: boolean
    error: string | null
  }>
}

/**
 * DashboardService handles dashboard aggregation and refresh operations
 */
export class DashboardService {
  /**
   * Get the consolidated dashboard report
   */
  static getDashboard(options: DashboardOptions = {}): DashboardReport {
    const { asOfDate, institutionIds } = options

    // Get all connections
    let connections = ConnectionModel.findAll()

    // Filter by institution IDs if provided
    if (institutionIds && institutionIds.length > 0) {
      connections = connections.filter((conn) =>
        institutionIds.includes(conn.institutionId)
      )
    }

    if (connections.length === 0) {
      return {
        asOfDate: asOfDate || null,
        grandTotal: 0,
        totalInstitutions: 0,
        institutions: [],
      }
    }

    // Group accounts by institution
    const institutionMap = new Map<string, InstitutionSummary>()

    for (const connection of connections) {
      const institution = InstitutionModel.findById(connection.institutionId)
      if (!institution) continue

      // Get accounts for this connection
      const accounts = AccountModel.findByConnectionId(connection.id)

      // Initialize institution summary if not exists
      if (!institutionMap.has(institution.id)) {
        institutionMap.set(institution.id, {
          institutionId: institution.id,
          institutionName: institution.name,
          subTotal: 0,
          accounts: [],
        })
      }

      const instSummary = institutionMap.get(institution.id)!

      // Add accounts with their latest balances
      for (const account of accounts) {
        let balance

        if (asOfDate) {
          // Get balance for specific date
          balance = BalanceRecordModel.getAsOfDate(account.id, asOfDate)
        } else {
          // Get latest balance
          balance = BalanceRecordModel.getLatestForAccount(account.id)
        }

        // Only include accounts that have balance records
        if (balance) {
          instSummary.accounts.push({
            accountId: account.id,
            accountName: account.accountName,
            accountNumberMasked: account.accountNumberMasked,
            totalValue: balance.totalValue,
            asOfDate: balance.asOfDate instanceof Date
              ? balance.asOfDate.toISOString().split('T')[0]
              : balance.asOfDate,
          })

          instSummary.subTotal += balance.totalValue
        }
      }
    }

    // Remove institutions with no accounts (no balances)
    const institutions = Array.from(institutionMap.values()).filter(
      (inst) => inst.accounts.length > 0
    )

    // Calculate grand total
    const grandTotal = institutions.reduce((sum, inst) => sum + inst.subTotal, 0)

    return {
      asOfDate: asOfDate || null,
      grandTotal,
      totalInstitutions: institutions.length,
      institutions,
    }
  }

  /**
   * Refresh all API-connected institutions and return updated dashboard
   */
  static async refreshDashboard(): Promise<RefreshResult> {
    const connections = ConnectionModel.findAll()
    const syncResults: Array<{
      institutionId: string
      success: boolean
      error: string | null
    }> = []

    // Sync each connection
    for (const connection of connections) {
      const institution = InstitutionModel.findById(connection.institutionId)

      if (!institution) {
        continue
      }

      // Only sync API-based institutions
      if (institution.apiType !== 'api') {
        continue
      }

      try {
        await ConnectionService.syncConnection(connection.id)
        syncResults.push({
          institutionId: institution.id,
          success: true,
          error: null,
        })
      } catch (error) {
        syncResults.push({
          institutionId: institution.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown sync error',
        })
      }
    }

    // Get updated dashboard
    const dashboard = this.getDashboard()

    return {
      dashboard,
      syncResults,
    }
  }

  /**
   * Export dashboard data as CSV
   */
  static exportDashboardCSV(options: DashboardOptions = {}): string {
    const dashboard = this.getDashboard(options)

    // CSV headers
    const headers = [
      'Institution',
      'Account Name',
      'Account Number',
      'Total Value',
      'As Of Date',
    ]

    const rows: string[][] = [headers]

    // Add data rows
    for (const institution of dashboard.institutions) {
      for (const account of institution.accounts) {
        rows.push([
          institution.institutionName,
          account.accountName,
          account.accountNumberMasked,
          account.totalValue.toFixed(2),
          account.asOfDate,
        ])
      }
    }

    // Add totals row
    rows.push([])
    rows.push(['GRAND TOTAL', '', '', dashboard.grandTotal.toFixed(2), ''])

    // Convert to CSV string
    return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  }
}
