import type { ReactNode } from 'react'
import { Bell, HelpCircle, User } from 'lucide-react'
import { cn } from '../../lib/utils'

interface HeaderProps {
  title: string
  children?: ReactNode
  className?: string
}

export function Header({ title, children, className = '' }: HeaderProps) {
  return (
    <header
      className={cn(
        'relative flex items-center justify-between h-16 px-6',
        'bg-obsidian-900/60 backdrop-blur-xl',
        'border-b border-obsidian-700/50',
        className
      )}
    >
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/30 to-transparent" />

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      {/* Right side content */}
      <div className="flex items-center gap-3">
        {/* Action buttons from children */}
        {children && <div className="flex items-center gap-2">{children}</div>}

        {/* Icons */}
        <div className="flex items-center gap-1">
          <button
            className={cn(
              'p-2.5 rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-obsidian-700/50',
              'transition-all duration-200'
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            className={cn(
              'p-2.5 rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-obsidian-700/50',
              'transition-all duration-200'
            )}
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-obsidian-700/50" />

        {/* User Avatar */}
        <button
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-full',
            'bg-gradient-to-br from-accent to-accent-600',
            'text-obsidian-950 font-medium text-sm',
            'ring-2 ring-obsidian-700/50 ring-offset-2 ring-offset-obsidian-900',
            'hover:ring-accent/50 transition-all duration-200'
          )}
          aria-label="User menu"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
