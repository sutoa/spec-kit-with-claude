import { ConnectionModel } from '../models/connection.js'
import { InstitutionModel } from '../models/institution.js'
import { AccountModel } from '../models/account.js'
import { BalanceRecordModel } from '../models/balance.js'
import * as snaptradeAccounts from './snaptrade/accounts.js'
import * as snaptradeHoldings from './snaptrade/holdings.js'
import type { DashboardReport, InstitutionSummary, AccountBalance } from '../types/index.js'

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
 * Get fixed SnapTrade user credentials from environment variables
 */
function getFixedSnaptradeCredentials(): { userId: string; userSecret: string } | null {
  const userId = process.env.SNAPTRADE_USER_ID
  const userSecret = process.env.SNAPTRADE_USER_SECRET

  if (!userId || !userSecret || userId === 'your-user-id-here' || userSecret === 'your-user-secret-here') {
    return null
  }

  return { userId, userSecret }
}

/**
 * DashboardService handles dashboard aggregation and refresh operations.
 *
 * MVP Mode: Fetches accounts directly from SnapTrade using fixed user credentials,
 * rather than requiring local connection records.
 */
export class DashboardService {
  /**
   * Get the consolidated dashboard report.
   * Fetches accounts directly from SnapTrade for the fixed user.
   */
  static async getDashboard(options: DashboardOptions = {}): Promise<DashboardReport> {
    const { asOfDate, institutionIds } = options

    const creds = getFixedSnaptradeCredentials()
    if (!creds) {
      return {
        asOfDate: asOfDate || null,
        grandTotal: 0,
        totalInstitutions: 0,
        institutions: [],
      }
    }

    try {
      // Fetch accounts directly from SnapTrade
      const snapAccounts = await snaptradeAccounts.listUserAccounts(creds.userId, creds.userSecret)

      if (snapAccounts.length === 0) {
        return {
          asOfDate: asOfDate || null,
          grandTotal: 0,
          totalInstitutions: 0,
          institutions: [],
        }
      }

      // Group accounts by institution name
      const institutionMap = new Map<string, InstitutionSummary>()

      for (const account of snapAccounts) {
        const instName = account.institutionName || 'Unknown Institution'

        // Filter by institution if specified
        if (institutionIds && institutionIds.length > 0) {
          const instId = instName.toLowerCase().replace(/\s+/g, '-')
          if (!institutionIds.includes(instId)) {
            continue
          }
        }

        // Initialize institution summary if not exists
        if (!institutionMap.has(instName)) {
          const instId = instName.toLowerCase().replace(/\s+/g, '-')
          // Look up logo URL from database
          const dbInstitution = InstitutionModel.findById(instId)
          institutionMap.set(instName, {
            institutionId: instId,
            institutionName: instName,
            logoUrl: dbInstitution?.logoUrl || null,
            subTotal: 0,
            accounts: [],
          })
        }

        const instSummary = institutionMap.get(instName)!

        // Get holdings for this account to calculate total value
        let totalValue = 0
        try {
          const holdingsData = await snaptradeHoldings.getAccountHoldings(
            creds.userId,
            creds.userSecret,
            account.id
          )
          totalValue = holdingsData.totalValue
        } catch (e) {
          console.warn(`Failed to fetch holdings for account ${account.id}:`, e)
        }

        // Add cash balance - use dedicated balance API if listUserAccounts doesn't have it
        let cashBalance = account.balance?.cash ?? null
        if (cashBalance === null) {
          try {
            const balanceData = await snaptradeAccounts.getAccountBalances(
              creds.userId,
              creds.userSecret,
              account.id
            )
            cashBalance = balanceData.cash ?? 0
          } catch (e) {
            console.warn(`Failed to fetch balance for account ${account.id}:`, e)
            cashBalance = 0
          }
        }
        totalValue += cashBalance

        const accountBalance: AccountBalance = {
          accountId: account.id as unknown as number, // Use string ID from SnapTrade
          accountName: account.name || 'Account',
          accountNumberMasked: account.number ? `•••• ${account.number.slice(-4)}` : '•••• 0000',
          totalValue,
          asOfDate: new Date().toISOString().split('T')[0],
        }

        instSummary.accounts.push(accountBalance)
        instSummary.subTotal += totalValue
      }

      // Convert to array
      const institutions = Array.from(institutionMap.values())

      // Calculate grand total
      const grandTotal = institutions.reduce((sum, inst) => sum + inst.subTotal, 0)

      return {
        asOfDate: asOfDate || null,
        grandTotal,
        totalInstitutions: institutions.length,
        institutions,
      }
    } catch (error) {
      console.error('Failed to fetch dashboard from SnapTrade:', error)
      return {
        asOfDate: asOfDate || null,
        grandTotal: 0,
        totalInstitutions: 0,
        institutions: [],
      }
    }
  }

  /**
   * Refresh dashboard data from SnapTrade.
   * With fixed user credentials, this simply refetches all account data.
   */
  static async refreshDashboard(): Promise<RefreshResult> {
    const creds = getFixedSnaptradeCredentials()

    if (!creds) {
      return {
        dashboard: {
          asOfDate: null,
          grandTotal: 0,
          totalInstitutions: 0,
          institutions: [],
        },
        syncResults: [{
          institutionId: 'all',
          success: false,
          error: 'SnapTrade credentials not configured',
        }],
      }
    }

    try {
      // Fetch fresh data from SnapTrade
      const dashboard = await this.getDashboard()

      return {
        dashboard,
        syncResults: [{
          institutionId: 'all',
          success: true,
          error: null,
        }],
      }
    } catch (error) {
      return {
        dashboard: {
          asOfDate: null,
          grandTotal: 0,
          totalInstitutions: 0,
          institutions: [],
        },
        syncResults: [{
          institutionId: 'all',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown sync error',
        }],
      }
    }
  }

  /**
   * Export dashboard data as CSV
   */
  static async exportDashboardCSV(options: DashboardOptions = {}): Promise<string> {
    const dashboard = await this.getDashboard(options)

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
