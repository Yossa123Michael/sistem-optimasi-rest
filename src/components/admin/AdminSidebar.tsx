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
  isOwner: boolean
  onLeaveCompany?: () => void
  onDeleteCompany?: () => void
}

export default function AdminSidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  onBackToHome,
  isOwner,
  onLeaveCompany,
  onDeleteCompany,
}: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  const userName = user.name || user.email.split('@')[0]

  const menuItems: Array<{ id: AdminView; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'input-data', label: 'Input Data' },
    { id: 'orders', label: 'Order Masuk' },
    { id: 'courier', label: 'Kurir' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'company-settings', label: 'Pengaturan Perusahaan' },
    ...(isOwner ? ([{ id: 'employees', label: 'Karyawan' }] as const) : []),
    ...(isOwner ? ([{ id: 'requests', label: 'Permintaan' }] as const) : []),
    { id: 'history', label: 'History' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-card border-r">
      <div className="p-6 border-b flex flex-col items-center">
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
                disabled={item.id !== 'home' && !user.companyId}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
      </div>

      <div className="p-4 space-y-2 border-t">
        {/* owner tidak boleh keluar perusahaan */}
        {user.companyId && onLeaveCompany && !isOwner && (
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

        {user.companyId && isOwner && onDeleteCompany && (
          <Button
            variant="destructive"
            className="w-full justify-center"
            onClick={() => {
              const ok = confirm(
                'Hapus perusahaan ini?\n\nIni akan mengarsipkan perusahaan dan menghapus data admin/kurir/paket terkait.',
              )
              if (!ok) return
              onDeleteCompany()
              if (isMobile) setOpen(false)
            }}
          >
            Hapus Perusahaan
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