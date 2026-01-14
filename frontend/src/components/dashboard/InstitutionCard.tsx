import type { InstitutionSummary } from '../../hooks/useDashboard'
import { AccountRow } from './AccountRow'

interface InstitutionCardProps {
  institution: InstitutionSummary
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Institution Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {institution.institutionName}
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(institution.subTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-6 py-4">
        {institution.accounts.length > 0 ? (
          <div className="space-y-0">
            {institution.accounts.map((account) => (
              <AccountRow key={account.accountId} account={account} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No accounts with balance data
          </p>
        )}
      </div>
    </div>
  )
}
