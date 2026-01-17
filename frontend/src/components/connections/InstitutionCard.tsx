import { useState } from 'react'
import type { InstitutionWithConnection } from '../../types'

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
    <div className="bg-panel-dark border border-border-dark rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left side: Logo and Info */}
        <div className="flex items-start gap-4 flex-1">
          {/* Institution Logo */}
          <div className="w-12 h-12 bg-input-bg-dark rounded-lg flex items-center justify-center flex-shrink-0">
            {institution.logoUrl && !logoError ? (
              <img
                src={institution.logoUrl}
                alt={`${institution.name} logo`}
                className="w-8 h-8 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="material-symbols-outlined text-text-secondary-dark text-2xl">
                account_balance
              </span>
            )}
          </div>

          {/* Institution Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary-dark font-semibold text-lg mb-2">
              {institution.name}
            </h3>

            {/* Connection Status */}
            <div className="flex items-center gap-2 mb-2">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-text-secondary-dark text-sm">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span className="text-text-secondary-dark text-sm">Not Connected</span>
                </>
              )}
            </div>

            {/* Last Updated */}
            {institution.lastUpdatedRelative && (
              <div className="text-text-secondary-dark text-sm">
                Updated {institution.lastUpdatedRelative}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 ml-4">
          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-input-bg-dark rounded-lg transition-colors"
                aria-label="More options"
              >
                <span className="material-symbols-outlined text-text-secondary-dark">
                  more_vert
                </span>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-1 bg-panel-dark border border-border-dark rounded-lg shadow-xl z-20 min-w-[160px]">
                    <button
                      onClick={handleDisconnect}
                      className="w-full px-4 py-2 text-left text-text-primary-dark hover:bg-input-bg-dark transition-colors flex items-center gap-2 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-red-500 text-lg">
                        link_off
                      </span>
                      <span>Disconnect</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
