import { useState } from 'react'
import { Unlink, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

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
        className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative max-w-md w-full p-6',
          'bg-obsidian-900 border border-obsidian-700/50 rounded-2xl',
          'shadow-glass animate-scale-in'
        )}
      >
        {/* Accent line - red for danger */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-error/50 to-transparent rounded-t-2xl" />

        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              'bg-error/10 border border-error/20'
            )}
          >
            <Unlink className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-foreground text-xl font-semibold mb-2">
            Disconnect {connection.institutionName}?
          </h2>
          <p className="text-muted-foreground text-sm">
            This will remove your connection and delete all associated accounts and balance history.
            This action cannot be undone.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn('mb-4 p-3 rounded-lg', 'bg-error/10 border border-error/20')}>
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* Warning */}
        <div className={cn('mb-6 p-4 rounded-xl', 'bg-warning/10 border border-warning/20')}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground text-sm font-medium mb-1">
                Warning: Data will be permanently deleted
              </p>
              <p className="text-muted-foreground text-xs">
                All accounts and transaction history from this institution will be removed from your
                dashboard.
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
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium',
              'bg-obsidian-800/50 text-foreground',
              'hover:bg-obsidian-700/50 transition-colors',
              'disabled:opacity-50'
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium',
              'bg-error text-white',
              'hover:bg-error-600 transition-colors',
              'disabled:opacity-50 flex items-center justify-center gap-2'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
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
