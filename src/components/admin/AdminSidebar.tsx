import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { List } from '@phosphor-icons/react'
import { User } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useState } from 'react'
import type { AdminView } from './AdminDashboard'

interface AdminSidebarProps {
  user: User
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminSidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  onBackToHome,
}: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const userName = user.name || user.email.split('@')[0]

  const menuItems: Array<{ id: AdminView; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'courier', label: 'Kurir' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'requests', label: 'Permintaan' },
    { id: 'history', label: 'History' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-card border-r">
      <div className="p-6 border-b flex flex-col items-center">
        <div className="w-24 h-24 mb-4 rounded-full border-2 border-border bg-secondary flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Photo</p>
        </div>
        <p className="text-sm text-center text-foreground font-medium">{userName}</p>

        {user.companyId ? (
          <p className="text-xs text-muted-foreground mt-1">Company ID: {user.companyId}</p>
        ) : (
          <p className="text-xs text-destructive mt-1">Belum pilih perusahaan</p>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <Button
                key={item.id}
                variant="ghost"
                className={
                  currentView === item.id
                    ? 'w-full justify-center bg-secondary text-foreground'
                    : 'w-full justify-center text-foreground'
                }
                onClick={() => {
                  onViewChange(item.id)
                  if (isMobile) setOpen(false)
                }}
                // Home selalu boleh; selain itu butuh companyId
                disabled={item.id !== 'home' && !user.companyId}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      <div className="p-4 space-y-2 border-t">
        {onBackToHome && (
          <Button
            variant="ghost"
            className="w-full justify-center text-foreground"
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
          <h2 className="font-semibold text-lg">Admin</h2>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <List size={24} />
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
    <aside className="fixed left-0 top-0 h-screen w-48 z-40">
      <SidebarContent />
    </aside>
  )
}