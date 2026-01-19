import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List } from '@phosphor-icons/react'
import { User } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useState } from 'react'

type CourierView = 'home' | 'recommendation' | 'update' | 'history'

interface CourierSidebarProps {
  user: User
  currentView: CourierView
  onViewChange: (view: CourierView) => void
  onLogout: () => void
  onBackToHome?: () => void
  onLeaveCompany?: () => void
}

export default function CourierSidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  onBackToHome,
  onLeaveCompany,
}: CourierSidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const userName = user.name || user.email.split('@')[0]

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-card border-r">
      <div className="p-6 border-b flex flex-col items-center">
  <p className="text-sm text-center text-foreground font-medium">{userName}</p>
  {/* opsional */}
  {user.companyId && (
    <p className="text-xs text-muted-foreground mt-1">Company ID: {user.companyId}</p>
  )}
</div>

      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant="ghost"
          className={currentView === 'home' ? 'w-full justify-center bg-secondary' : 'w-full justify-center'}
          onClick={() => {
            onViewChange('home')
            if (isMobile) setOpen(false)
          }}
        >
          Home
        </Button>

        <Button
          variant="ghost"
          className={currentView === 'recommendation' ? 'w-full justify-center bg-secondary' : 'w-full justify-center'}
          onClick={() => {
            onViewChange('recommendation')
            if (isMobile) setOpen(false)
          }}
        >
          Rekomendasi
        </Button>

        <Button
          variant="ghost"
          className={currentView === 'update' ? 'w-full justify-center bg-secondary' : 'w-full justify-center'}
          onClick={() => {
            onViewChange('update')
            if (isMobile) setOpen(false)
          }}
        >
          Update Status
        </Button>

        <Button
          variant="ghost"
          className={currentView === 'history' ? 'w-full justify-center bg-secondary' : 'w-full justify-center'}
          onClick={() => {
            onViewChange('history')
            if (isMobile) setOpen(false)
          }}
        >
          History
        </Button>
      </nav>

      <div className="p-4 space-y-2 border-t">
        {/* NEW: Keluar perusahaan di bawah */}
        {user.companyId && onLeaveCompany && (
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => {
              const ok = confirm('Keluar dari perusahaan ini?')
              if (!ok) return
              onLeaveCompany()
              if (isMobile) setOpen(false)
            }}
          >
            Keluar Perusahaan
          </Button>
        )}

        {onBackToHome && (
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => {
              onBackToHome()
              if (isMobile) setOpen(false)
            }}
          >
            Kembali ke Home
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-center text-destructive hover:text-destructive/80"
          onClick={() => {
            onLogout()
            if (isMobile) setOpen(false)
          }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">RouteOptima</h2>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <List className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden lg:flex w-48 fixed inset-y-0 left-0">
      <SidebarContent />
    </aside>
  )
}