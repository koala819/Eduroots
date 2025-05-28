import React from 'react'
import SidebarMenu from './SidebarMenu'

export default function TempSocketioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar interactive */}
      <SidebarMenu />
      {/* Main content */}
      <main className="flex-1 flex flex-col bg-slate-50">
        {children}
      </main>
    </div>
  )
}