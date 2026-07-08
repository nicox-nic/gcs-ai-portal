import { useState, type ReactNode } from 'react'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { ProfileIncompleteBanner } from '@/components/layout/ProfileIncompleteBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-stone-100">
      <div className="hidden md:block">
        <Sidebar className="min-h-screen" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <ProfileIncompleteBanner />
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-5">{children}</main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[220px] p-0">
          <Sidebar onNavigate={() => setMobileNavOpen(false)} className="min-h-full border-r-0" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
