import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/connections', label: 'Connections', icon: 'link' },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`
        flex flex-col h-full bg-panel-dark border-r border-border-dark
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo and Brand */}
      <div className="flex items-center h-16 px-4 border-b border-border-dark">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="material-symbols-outlined text-white text-xl">
              account_balance
            </span>
          </div>
          <span
            className={`
              font-semibold text-text-primary-dark whitespace-nowrap
              transition-opacity duration-300
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}
          >
            Financial Hub
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary-dark hover:bg-search-bg-dark hover:text-text-primary-dark'
                  }
                `}
              >
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span
                  className={`
                    whitespace-nowrap transition-opacity duration-300
                    ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                  `}
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-border-dark">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="
            flex items-center justify-center w-full py-2 rounded-lg
            text-text-secondary-dark hover:bg-search-bg-dark hover:text-text-primary-dark
            transition-colors duration-200
          "
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>
    </aside>
  )
}
