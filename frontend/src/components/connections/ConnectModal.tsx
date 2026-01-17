import { useState, useEffect, useRef, FormEvent } from 'react'
import type { InstitutionWithConnection, CredentialData } from '../../types'
import { createConnection, getPortalUrl, getConnectionStatus, syncConnection } from '../../services/api'

interface ConnectModalProps {
  institution: InstitutionWithConnection | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type OAuthStep = 'idle' | 'creating' | 'opening' | 'waiting' | 'syncing' | 'complete' | 'error'

export function ConnectModal({ institution, isOpen, onClose, onSuccess }: ConnectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OAuth flow state
  const [oauthStep, setOAuthStep] = useState<OAuthStep>('idle')
  const [connectionId, setConnectionId] = useState<number | null>(null)
  const popupRef = useRef<Window | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    setOAuthStep('idle')
    setConnectionId(null)
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const handleClose = () => {
    if (!isSubmitting && oauthStep !== 'syncing') {
      resetForm()
      onClose()
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Handle completing the connection (called manually or when popup closes)
  const handleCompleteConnection = async (connId: number) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    setOAuthStep('syncing')

    try {
      await syncConnection(connId)
      const status = await getConnectionStatus(connId)

      if (status.accountCount > 0 || status.status === 'connected') {
        setOAuthStep('complete')
        setTimeout(() => {
          resetForm()
          onSuccess()
          onClose()
        }, 1000)
      } else {
        setError('No accounts found. Please try connecting again.')
        setOAuthStep('error')
      }
    } catch (err) {
      console.error('Sync error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync accounts. Please try again.')
      setOAuthStep('error')
    }
  }

  // OAuth flow handler
  const handleOAuthConnect = async () => {
    if (!institution) return

    setError(null)
    setOAuthStep('creating')

    try {
      // Step 1: Create connection (registers SnapTrade user)
      const connection = await createConnection({ institutionId: institution.id })
      setConnectionId(connection.id)
      setOAuthStep('opening')

      // Step 2: Get portal URL
      const { url } = await getPortalUrl(connection.id)

      // Step 3: Open popup
      const popup = window.open(
        url,
        'snaptrade-portal',
        'width=800,height=700,scrollbars=yes,resizable=yes'
      )
      popupRef.current = popup

      if (!popup) {
        setError('Popup was blocked. Please allow popups for this site.')
        setOAuthStep('error')
        return
      }

      setOAuthStep('waiting')

      // Step 4: Poll for popup close AND backend status
      let pollCount = 0
      const maxPolls = 150 // 5 minutes max (150 * 2 seconds)

      pollIntervalRef.current = setInterval(async () => {
        pollCount++

        // Stop polling after max time
        if (pollCount >= maxPolls) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError('Connection timed out. Click "I\'ve finished" if you completed the connection.')
          return
        }

        try {
          // Check if popup was closed
          const popupClosed = !popup || popup.closed

          if (popupClosed) {
            // Popup closed - try to complete the connection
            await handleCompleteConnection(connection.id)
          } else {
            // Popup still open - check backend status periodically (every 6 seconds)
            if (pollCount % 3 === 0) {
              const status = await getConnectionStatus(connection.id)
              if (status.accountCount > 0) {
                // Accounts synced! Complete the flow
                popup.close()
                await handleCompleteConnection(connection.id)
              }
            }
          }
        } catch (err) {
          console.error('Error during polling:', err)
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please try again.')
      setOAuthStep('error')
    }
  }

  // Manual completion handler
  const handleManualComplete = async () => {
    if (connectionId) {
      await handleCompleteConnection(connectionId)
    }
  }

  // Credential form submit handler
  const handleCredentialSubmit = async (e: FormEvent) => {
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

      const connection = await createConnection({
        institutionId: institution.id,
        credentials,
      })

      // Sync after creating connection
      await syncConnection(connection.id)

      resetForm()
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !institution) return null

  const isOAuth = institution.authType === 'oauth'
  const isApiKey = institution.authType === 'api_key'

  const getOAuthStepMessage = () => {
    switch (oauthStep) {
      case 'creating':
        return 'Setting up connection...'
      case 'opening':
        return 'Opening SnapTrade portal...'
      case 'waiting':
        return 'Complete authentication in the popup window...'
      case 'syncing':
        return 'Syncing your accounts...'
      case 'complete':
        return 'Connected successfully!'
      default:
        return ''
    }
  }

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
              {isOAuth
                ? 'Connect securely via SnapTrade'
                : `Enter your ${isApiKey ? 'API credentials' : 'account credentials'} to connect`}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={oauthStep === 'syncing'}
            className="p-1 hover:bg-input-bg-dark rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-text-secondary-dark">
              close
            </span>
          </button>
        </div>

        {isOAuth ? (
          // OAuth Flow UI
          <div>
            {oauthStep === 'idle' || oauthStep === 'error' ? (
              <>
                <div className="mb-6 p-4 bg-input-bg-dark rounded-lg">
                  <p className="text-text-secondary-dark text-sm mb-3">
                    You'll be redirected to SnapTrade to securely connect your {institution.name} account.
                    Your credentials are never shared with us.
                  </p>
                  <ul className="text-text-secondary-dark text-xs space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                      Bank-level security
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                      Read-only access to your accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                      Disconnect anytime
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-input-bg-dark hover:bg-input-bg-dark/80 text-text-primary-dark rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthConnect}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">link</span>
                    Connect via SnapTrade
                  </button>
                </div>
              </>
            ) : oauthStep === 'waiting' ? (
              // Waiting for user to complete OAuth
              <div className="text-center py-6">
                <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">
                  progress_activity
                </span>
                <p className="text-text-primary-dark font-medium mb-2">
                  {getOAuthStepMessage()}
                </p>
                <p className="text-text-secondary-dark text-sm mb-6">
                  Don't see the popup? Check if it was blocked by your browser.
                </p>

                {/* Manual completion button */}
                <button
                  type="button"
                  onClick={handleManualComplete}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  I've finished connecting
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="block mx-auto mt-4 text-text-secondary-dark hover:text-text-primary-dark text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // OAuth in progress (creating, opening, syncing, complete)
              <div className="text-center py-8">
                {oauthStep === 'complete' ? (
                  <span className="material-symbols-outlined text-green-400 text-6xl mb-4">
                    check_circle
                  </span>
                ) : (
                  <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">
                    progress_activity
                  </span>
                )}
                <p className="text-text-primary-dark font-medium mb-2">
                  {getOAuthStepMessage()}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Credential Form UI
          <form onSubmit={handleCredentialSubmit}>
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
                Your credentials will be encrypted and stored securely.
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
        )}
      </div>
    </div>
  )
}
