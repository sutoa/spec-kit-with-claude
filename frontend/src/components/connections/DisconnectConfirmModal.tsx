import { useState } from 'react'

interface DisconnectConfirmModalProps {
  connection: { id: number; institutionName: string } | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (connectionId: number) => Promise<void>
}

export function DisconnectConfirmModal({
  connection,
  isOpen,
  onClose,
  onConfirm,
}: DisconnectConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!connection) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onConfirm(connection.id)
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null)
      onClose()
    }
  }

  if (!isOpen || !connection) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-panel-dark border border-border-dark rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-red-500 text-4xl">
              link_off
            </span>
          </div>
          <h2 className="text-text-primary-dark text-2xl font-semibold mb-2">
            Disconnect {connection.institutionName}?
          </h2>
          <p className="text-text-secondary-dark text-sm">
            This will remove your connection and delete all associated accounts and balance
            history. This action cannot be undone.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-yellow-500 text-xl flex-shrink-0">
              warning
            </span>
            <div>
              <p className="text-text-primary-dark text-sm font-medium mb-1">
                Warning: Data will be permanently deleted
              </p>
              <p className="text-text-secondary-dark text-xs">
                All accounts and transaction history from this institution will be removed from
                your dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-input-bg-dark hover:bg-input-bg-dark/80 text-text-primary-dark rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                <span>Disconnecting...</span>
              </>
            ) : (
              'Disconnect'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
