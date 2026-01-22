import { useState } from 'react'
import { Building2 } from 'lucide-react'
import type { InstitutionSummary } from '../../hooks/useDashboard'
import { AccountRow } from './AccountRow'
import { cn } from '../../lib/utils'

interface InstitutionCardProps {
  institution: InstitutionSummary
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  const [logoError, setLogoError] = useState(false)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-gradient-to-br from-obsidian-850 to-obsidian-900',
        'border border-obsidian-700/50',
        'card-hover'
      )}
    >
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/30 to-transparent" />

      {/* Institution Header */}
      <div className="px-6 py-4 border-b border-obsidian-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-obsidian-800/50 border border-obsidian-700/50'
              )}
            >
              {institution.logoUrl && !logoError ? (
                <img
                  src={institution.logoUrl}
                  alt={`${institution.institutionName} logo`}
                  className="w-6 h-6 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              {institution.institutionName}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subtotal</p>
            <p className="text-xl font-mono font-semibold text-foreground tracking-tight">
              {formatCurrency(institution.subTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-6 py-4">
        {institution.accounts.length > 0 ? (
          <div className="space-y-0 divide-y divide-obsidian-700/30">
            {institution.accounts.map((account) => (
              <AccountRow key={account.accountId} account={account} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No accounts with balance data
          </p>
        )}
      </div>
    </div>
  )
}
