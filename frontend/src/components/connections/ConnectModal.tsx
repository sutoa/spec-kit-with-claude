import { useState, useEffect, useRef, FormEvent } from 'react'
import {
  X,
  Link2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Eye,
  Unlink,
} from 'lucide-react'
import type { InstitutionWithConnection, CredentialData } from '../../types'
import {
  createConnection,
  getPortalUrl,
  getConnectionStatus,
  syncConnection,
} from '../../services/api'
import { cn } from '../../lib/utils'

interface ConnectModalProps {
  institution: InstitutionWithConnection | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  brokerSlug?: string
}

type OAuthStep = 'idle' | 'creating' | 'opening' | 'waiting' | 'syncing' | 'complete' | 'error'

export function ConnectModal({
  institution,
  isOpen,
  onClose,
  onSuccess,
  brokerSlug,
}: ConnectModalProps) {
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

      // Step 2: Get portal URL (pass broker slug if provided)
      const { url } = await getPortalUrl(connection.id, brokerSlug)

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
          setError("Connection timed out. Click \"I've finished\" if you completed the connection.")
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
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent rounded-t-2xl" />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold mb-1">
              Connect to {institution.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isOAuth
                ? 'Connect securely via SnapTrade'
                : `Enter your ${isApiKey ? 'API credentials' : 'account credentials'} to connect`}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={oauthStep === 'syncing'}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-obsidian-700/50 disabled:opacity-50'
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isOAuth ? (
          // OAuth Flow UI
          <div>
            {oauthStep === 'idle' || oauthStep === 'error' ? (
              <>
                <div
                  className={cn(
                    'mb-6 p-4 rounded-xl',
                    'bg-obsidian-800/50 border border-obsidian-700/50'
                  )}
                >
                  <p className="text-muted-foreground text-sm mb-4">
                    You'll be redirected to SnapTrade to securely connect your{' '}
                    {institution.name} account. Your credentials are never shared with us.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                      Bank-level security
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4 text-success shrink-0" />
                      Read-only access to your accounts
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Unlink className="w-4 h-4 text-success shrink-0" />
                      Disconnect anytime
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    className={cn(
                      'mb-4 p-3 rounded-lg',
                      'bg-error/10 border border-error/20'
                    )}
                  >
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-lg font-medium',
                      'bg-obsidian-800/50 text-foreground',
                      'hover:bg-obsidian-700/50 transition-colors'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthConnect}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-lg font-medium',
                      'bg-accent text-obsidian-950',
                      'hover:bg-accent-400 transition-colors',
                      'flex items-center justify-center gap-2',
                      'shadow-glow-sm hover:shadow-glow'
                    )}
                  >
                    <Link2 className="w-5 h-5" />
                    Connect via SnapTrade
                  </button>
                </div>
              </>
            ) : oauthStep === 'waiting' ? (
              // Waiting for user to complete OAuth
              <div className="text-center py-6">
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">{getOAuthStepMessage()}</p>
                <p className="text-muted-foreground text-sm mb-6">
                  Don't see the popup? Check if it was blocked by your browser.
                </p>

                {/* Manual completion button */}
                <button
                  type="button"
                  onClick={handleManualComplete}
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium',
                    'bg-success text-obsidian-950',
                    'hover:bg-success-400 transition-colors'
                  )}
                >
                  I've finished connecting
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="block mx-auto mt-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // OAuth in progress (creating, opening, syncing, complete)
              <div className="text-center py-8">
                {oauthStep === 'complete' ? (
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                ) : (
                  <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
                )}
                <p className="text-foreground font-medium mb-2">{getOAuthStepMessage()}</p>
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
                      className="block text-foreground text-sm font-medium mb-2"
                    >
                      API Key
                    </label>
                    <input
                      type="text"
                      id="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-obsidian-800/50 border border-obsidian-700/50',
                        'text-foreground placeholder-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                        'disabled:opacity-50 transition-all'
                      )}
                      placeholder="Enter your API key"
                      required
                    />
                  </div>

                  {/* API Secret */}
                  <div>
                    <label
                      htmlFor="apiSecret"
                      className="block text-foreground text-sm font-medium mb-2"
                    >
                      API Secret
                    </label>
                    <input
                      type="password"
                      id="apiSecret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-obsidian-800/50 border border-obsidian-700/50',
                        'text-foreground placeholder-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                        'disabled:opacity-50 transition-all'
                      )}
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
                      className="block text-foreground text-sm font-medium mb-2"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-obsidian-800/50 border border-obsidian-700/50',
                        'text-foreground placeholder-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                        'disabled:opacity-50 transition-all'
                      )}
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-foreground text-sm font-medium mb-2"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-obsidian-800/50 border border-obsidian-700/50',
                        'text-foreground placeholder-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
                        'disabled:opacity-50 transition-all'
                      )}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={cn('mb-4 p-3 rounded-lg', 'bg-error/10 border border-error/20')}>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            {/* Info Message */}
            <div className={cn('mb-6 p-3 rounded-lg', 'bg-accent/10 border border-accent/20')}>
              <p className="text-muted-foreground text-xs">
                Your credentials will be encrypted and stored securely.
              </p>
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
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg font-medium',
                  'bg-accent text-obsidian-950',
                  'hover:bg-accent-400 transition-colors',
                  'disabled:opacity-50 flex items-center justify-center gap-2',
                  'shadow-glow-sm hover:shadow-glow'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
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
