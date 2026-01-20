import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Link2, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    path: '/connections',
    label: 'Connections',
    icon: <Link2 className="w-5 h-5" />,
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex flex-col h-full z-10',
        'bg-obsidian-900/80 backdrop-blur-xl',
        'border-r border-obsidian-700/50',
        'transition-all duration-300 ease-out-expo',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      {/* Logo and Brand */}
      <div className="flex items-center h-16 px-4 border-b border-obsidian-700/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'bg-gradient-to-br from-accent to-accent-600',
              'shadow-glow-sm'
            )}
          >
            <Wallet className="w-5 h-5 text-obsidian-950" />
          </div>
          <span
            className={cn(
              'font-semibold text-foreground whitespace-nowrap tracking-tight',
              'transition-all duration-300 ease-out-expo',
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Financial Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200 ease-out-expo group',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-obsidian-700/50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'transition-transform duration-200',
                        'group-hover:scale-110',
                        isActive && 'text-accent'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        'whitespace-nowrap font-medium',
                        'transition-all duration-300 ease-out-expo',
                        isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-obsidian-700/50">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className={cn(
            'flex items-center justify-center w-full py-2.5 rounded-lg',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-obsidian-700/50',
            'transition-all duration-200'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-obsidian-600/50 to-transparent" />
    </aside>
  )
}
