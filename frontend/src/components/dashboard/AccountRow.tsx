import { Wallet } from 'lucide-react'
import type { AccountBalance } from '../../hooks/useDashboard'
import { cn } from '../../lib/utils'

interface AccountRowProps {
  account: AccountBalance
}

export function AccountRow({ account }: AccountRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between py-4 first:pt-0 last:pb-0',
        'group hover:bg-obsidian-800/30 -mx-2 px-2 rounded-lg transition-colors'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
            'bg-obsidian-800/30 border border-obsidian-700/30',
            'group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors'
          )}
        >
          <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{account.accountName}</p>
          <p className="text-xs text-muted-foreground font-mono">{account.accountNumberMasked}</p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-sm font-mono font-semibold text-foreground tracking-tight">
          {formatCurrency(account.totalValue)}
        </p>
        <p className="text-xs text-muted-foreground">as of {formatDate(account.asOfDate)}</p>
      </div>
    </div>
  )
}
