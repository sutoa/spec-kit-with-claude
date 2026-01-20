import { Building2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TotalInstitutionsProps {
  count: number
}

export function TotalInstitutions({ count }: TotalInstitutionsProps) {
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
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success/40 to-transparent" />

      {/* Subtle glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-success/5 rounded-full blur-3xl" />

      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'bg-success/10 text-success'
            )}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Connected Institutions
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-display-md font-mono text-foreground tracking-tight">{count}</p>
          <span className="text-sm text-muted-foreground">
            {count === 1 ? 'institution' : 'institutions'}
          </span>
        </div>
      </div>
    </div>
  )
}
