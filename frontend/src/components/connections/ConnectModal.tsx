import { useState, FormEvent } from 'react'
import type { InstitutionWithConnection, CredentialData } from '../../types'

interface ConnectModalProps {
  institution: InstitutionWithConnection | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (institutionId: string, credentials: CredentialData) => Promise<void>
}

export function ConnectModal({ institution, isOpen, onClose, onSubmit }: ConnectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for API key
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')

  // Form state for username/password
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const resetForm = () => {
    setApiKey('')
    setApiSecret('')
    setUsername('')
    setPassword('')
    setError(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!institution) return

    setError(null)
    setIsSubmitting(true)

    try {
      let credentials: CredentialData

      if (institution.authType === 'api_key') {
        if (!apiKey.trim() || !apiSecret.trim()) {
          setError('Please provide both API key and API secret')
          setIsSubmitting(false)
          return
        }

        credentials = {
          type: 'api_key',
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
        }
      } else {
        if (!username.trim() || !password.trim()) {
          setError('Please provide both username and password')
          setIsSubmitting(false)
          return
        }

        credentials = {
          type: 'credentials',
          username: username.trim(),
          password: password.trim(),
        }
      }

      await onSubmit(institution.id, credentials)
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !institution) return null

  const isApiKey = institution.authType === 'api_key'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-panel-dark border border-border-dark rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-text-primary-dark text-2xl font-semibold mb-1">
              Connect to {institution.name}
            </h2>
            <p className="text-text-secondary-dark text-sm">
              Enter your {isApiKey ? 'API credentials' : 'account credentials'} to connect
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-input-bg-dark rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-text-secondary-dark">
              close
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {isApiKey ? (
              <>
                {/* API Key */}
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-text-primary-dark text-sm font-medium mb-2"
                  >
                    API Key
                  </label>
                  <input
                    type="text"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Enter your API key"
                    required
                  />
                </div>

                {/* API Secret */}
                <div>
                  <label
                    htmlFor="apiSecret"
                    className="block text-text-primary-dark text-sm font-medium mb-2"
                  >
                    API Secret
                  </label>
                  <input
                    type="password"
                    id="apiSecret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Enter your API secret"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-text-primary-dark text-sm font-medium mb-2"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-text-primary-dark text-sm font-medium mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-input-bg-dark border border-input-border-dark rounded-lg text-text-primary-dark placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-text-secondary-dark text-xs">
              🔒 Your credentials will be encrypted and stored securely.
            </p>
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">
                    progress_activity
                  </span>
                  <span>Connecting...</span>
                </>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
