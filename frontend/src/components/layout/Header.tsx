import type { ReactNode } from 'react'

interface HeaderProps {
  title: string
  children?: ReactNode
  className?: string
}

export function Header({ title, children, className = '' }: HeaderProps) {
  return (
    <header
      className={`
        flex items-center justify-between h-16 px-6
        bg-panel-dark border-b border-border-dark
        ${className}
      `}
    >
      {/* Title */}
      <h1 className="text-xl font-semibold text-text-primary-dark">
        {title}
      </h1>

      {/* Right side content */}
      <div className="flex items-center gap-4">
        {/* Action buttons from children */}
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}

        {/* Icons */}
        <div className="flex items-center gap-2">
          <button
            className="
              p-2 rounded-lg text-text-secondary-dark
              hover:bg-search-bg-dark hover:text-text-primary-dark
              transition-colors duration-200
            "
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="
              p-2 rounded-lg text-text-secondary-dark
              hover:bg-search-bg-dark hover:text-text-primary-dark
              transition-colors duration-200
            "
            aria-label="Help"
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>

        {/* User Avatar */}
        <div className="ml-2">
          <img
            src="https://ui-avatars.com/api/?name=User&background=137fec&color=fff&size=32"
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    </header>
  )
}
