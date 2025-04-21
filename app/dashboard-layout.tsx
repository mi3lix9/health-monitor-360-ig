import type React from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ReactQueryRealtimeProvider } from "@/components/react-query-realtime-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ReactQueryRealtimeProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <MainNav />
            <UserNav />
          </div>
        </header>
        <main className="flex-1">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </ReactQueryRealtimeProvider>
  )
}
