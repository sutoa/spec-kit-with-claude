import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/layout/Header'
import { InstitutionList } from '../components/connections/InstitutionList'
import { ConnectModal } from '../components/connections/ConnectModal'
import { DisconnectConfirmModal } from '../components/connections/DisconnectConfirmModal'
import { AddInstitutionModal } from '../components/connections/AddInstitutionModal'
import { useInstitutions, useDeleteConnection } from '../hooks/useInstitutions'
import type { InstitutionWithConnection, Brokerage } from '../types'

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
      <div className="px-6 py-4 border-b border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary-dark">
              Manage Financial Institutions
            </h2>
            <p className="text-sm text-text-secondary-dark mt-1">
              Connect and manage your brokerage accounts
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Add Institution
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-dark text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search institutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-search-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">
              progress_activity
            </span>
            <p className="text-text-secondary-dark">Loading institutions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
            <h3 className="text-text-primary-dark text-xl font-semibold mb-2">
              Failed to load institutions
            </h3>
            <p className="text-text-secondary-dark text-center max-w-md">
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
