import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
