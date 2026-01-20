import { TrendingUp, Calendar } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GrandTotalProps {
  total: number
  asOfDate: string | null
}

export function GrandTotal({ total, asOfDate }: GrandTotalProps) {
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
        'relative overflow-hidden rounded-xl p-6',
        'bg-gradient-to-br from-obsidian-850 to-obsidian-900',
        'border border-obsidian-700/50',
        'card-hover'
      )}
    >
      {/* Accent gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      {/* Subtle glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg',
                'bg-accent/10 text-accent'
              )}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Grand Total
            </p>
          </div>

          <p className="text-display-md font-mono text-foreground tracking-tight">
            {formatCurrency(total)}
          </p>
        </div>

        {asOfDate && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'bg-obsidian-800/50 border border-obsidian-700/50'
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">As of</p>
              <p className="text-sm font-medium text-foreground">{formatDate(asOfDate)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
