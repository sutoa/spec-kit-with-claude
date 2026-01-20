import { useState } from 'react'
import { Building2, MoreVertical, Unlink } from 'lucide-react'
import type { InstitutionWithConnection } from '../../types'
import { cn } from '../../lib/utils'

interface InstitutionCardProps {
  institution: InstitutionWithConnection
  onConnect?: (institution: InstitutionWithConnection) => void
  onDisconnect?: (connection: { id: number; institutionName: string }) => void
}

export function InstitutionCard({ institution, onConnect, onDisconnect }: InstitutionCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const isConnected = institution.connection?.status === 'connected'

  const handleConnect = () => {
    if (onConnect) {
      onConnect(institution)
    }
  }

  const handleDisconnect = () => {
    if (onDisconnect && institution.connection) {
      onDisconnect({
        id: institution.connection.id,
        institutionName: institution.name,
      })
      setShowMenu(false)
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5',
        'bg-gradient-to-br from-obsidian-850 to-obsidian-900',
        'border border-obsidian-700/50',
        'hover:border-accent/30 transition-all duration-300',
        'card-hover group'
      )}
    >
      {/* Accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-px',
          'bg-gradient-to-r from-transparent to-transparent transition-all duration-300',
          isConnected ? 'via-success/50' : 'via-obsidian-600/30 group-hover:via-accent/40'
        )}
      />

      <div className="flex items-start justify-between">
        {/* Left side: Logo and Info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Institution Logo */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              'bg-obsidian-800/50 border border-obsidian-700/50',
              'group-hover:border-accent/20 transition-colors'
            )}
          >
            {institution.logoUrl && !logoError ? (
              <img
                src={institution.logoUrl}
                alt={`${institution.name} logo`}
                className="w-8 h-8 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Building2 className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Institution Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-semibold text-base mb-2 truncate">
              {institution.name}
            </h3>

            {/* Connection Status */}
            <div className="flex items-center gap-2 mb-1">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-muted-foreground text-sm">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-obsidian-500" />
                  <span className="text-muted-foreground text-sm">Not Connected</span>
                </>
              )}
            </div>

            {/* Last Updated */}
            {institution.lastUpdatedRelative && (
              <p className="text-muted-foreground text-xs">
                Updated {institution.lastUpdatedRelative}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 ml-2">
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-obsidian-700/50'
                )}
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

                  {/* Menu */}
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-1 z-20 min-w-[160px]',
                      'bg-obsidian-850 backdrop-blur-xl',
                      'border border-obsidian-700/50 rounded-lg',
                      'shadow-glass overflow-hidden',
                      'animate-scale-in origin-top-right'
                    )}
                  >
                    <button
                      onClick={handleDisconnect}
                      className={cn(
                        'w-full px-4 py-2.5 text-left',
                        'flex items-center gap-2',
                        'text-foreground hover:bg-error/10 hover:text-error',
                        'transition-colors'
                      )}
                    >
                      <Unlink className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm',
                'bg-accent text-obsidian-950',
                'hover:bg-accent-400 transition-all duration-200',
                'shadow-glow-sm hover:shadow-glow'
              )}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
