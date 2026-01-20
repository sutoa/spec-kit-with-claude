import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { InstitutionList } from '../components/connections/InstitutionList'
import { ConnectModal } from '../components/connections/ConnectModal'
import { DisconnectConfirmModal } from '../components/connections/DisconnectConfirmModal'
import { AddInstitutionModal } from '../components/connections/AddInstitutionModal'
import { useInstitutions, useDeleteConnection } from '../hooks/useInstitutions'
import type { InstitutionWithConnection, Brokerage } from '../types'
import { cn } from '../lib/utils'

export function Connections() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionWithConnection | null>(
    null
  )
  const [selectedBrokerage, setSelectedBrokerage] = useState<Brokerage | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [disconnectConnection, setDisconnectConnection] = useState<{
    id: number
    institutionName: string
  } | null>(null)

  const queryClient = useQueryClient()

  // Fetch institutions
  const { data: institutions = [], isLoading, error } = useInstitutions()

  // Mutations
  const deleteConnection = useDeleteConnection()

  // Handlers
  const handleConnect = (institution: InstitutionWithConnection) => {
    setSelectedInstitution(institution)
  }

  const handleDisconnect = (connection: { id: number; institutionName: string }) => {
    setDisconnectConnection(connection)
  }

  const handleConnectSuccess = () => {
    // Refetch institutions and brokerages to update connection status
    queryClient.invalidateQueries({ queryKey: ['institutions'] })
    queryClient.invalidateQueries({ queryKey: ['brokerages'] })
  }

  const handleBrokerageSelect = (brokerage: Brokerage) => {
    setIsAddModalOpen(false)
    // Create a synthetic institution object for the ConnectModal
    const syntheticInstitution: InstitutionWithConnection = {
      id: brokerage.slug.toLowerCase(),
      name: brokerage.name,
      logoUrl: null,
      apiType: 'api',
      authType: 'oauth',
      connection: null,
      lastUpdatedRelative: null,
    }
    setSelectedBrokerage(brokerage)
    setSelectedInstitution(syntheticInstitution)
  }

  const handleDisconnectConfirm = async (connectionId: number) => {
    await deleteConnection.mutateAsync(connectionId)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Connections" />

      {/* Page Header */}
      <div className="px-6 py-5 border-b border-obsidian-700/50">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Manage Financial Institutions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect and manage your brokerage accounts
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium',
              'bg-accent text-obsidian-950',
              'hover:bg-accent-400 transition-all duration-200',
              'shadow-glow-sm hover:shadow-glow'
            )}
          >
            <Plus className="w-5 h-5" />
            Add Institution
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search institutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'bg-obsidian-800/50 border border-obsidian-700/50',
              'text-foreground placeholder-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
              'transition-all duration-200'
            )}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
            <p className="text-muted-foreground">Loading institutions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-12 h-12 text-error mb-4" />
            <h3 className="text-foreground text-xl font-semibold mb-2">
              Failed to load institutions
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        ) : (
          <InstitutionList
            institutions={institutions}
            searchQuery={searchQuery}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        )}
      </div>

      {/* Connect Modal */}
      <ConnectModal
        institution={selectedInstitution}
        isOpen={selectedInstitution !== null}
        onClose={() => {
          setSelectedInstitution(null)
          setSelectedBrokerage(null)
        }}
        onSuccess={handleConnectSuccess}
        brokerSlug={selectedBrokerage?.slug}
      />

      {/* Disconnect Confirm Modal */}
      <DisconnectConfirmModal
        connection={disconnectConnection}
        isOpen={disconnectConnection !== null}
        onClose={() => setDisconnectConnection(null)}
        onConfirm={handleDisconnectConfirm}
      />

      {/* Add Institution Modal */}
      <AddInstitutionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelect={handleBrokerageSelect}
      />
    </div>
  )
}
