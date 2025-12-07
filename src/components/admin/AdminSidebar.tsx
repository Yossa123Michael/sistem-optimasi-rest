import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { List } from '@phosphor-icons/react'
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { useState } from 'react'

type AdminView = 'home' | 'input-data' | 'courier' | 'courier-activation' | 'monitoring' | 'history'

interface AdminSidebarProps {
  user: User
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  onLogout: () => void
  onBackToHome?: () => void
}

export default function AdminSidebar({ user, currentView, onViewChange, onLogout, onBackToHome }: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const userName = user.name || user.email.split('@')[0]

  const currentCompany = (companies || []).find(c => c.id === user.companyId)
  const isOwner = currentCompany?.ownerId === user.id

  const handleDeleteCompany = () => {
    if (!user.companyId || !isOwner) return

    setCompanies((prev) => (prev || []).filter(c => c.id !== user.companyId))

    setUsers((prevUsers) => 
      (prevUsers || []).map(u => ({
        ...u,
        companies: (u.companies || []).filter(m => m.companyId !== user.companyId),
        companyId: u.companyId === user.companyId ? undefined : u.companyId,
        role: u.companyId === user.companyId ? undefined : u.role
      }))
    )

    toast.success('Perusahaan berhasil dihapus')
    setShowDeleteDialog(false)
    
    if (onBackToHome) {
      setTimeout(() => onBackToHome(), 500)
    }
  }

  const menuItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'input-data' as const, label: 'Input Data Paket' },
    { id: 'courier' as const, label: 'Kelola Kurir' },
    { id: 'monitoring' as const, label: 'Monitoring' },
    { id: 'history' as const, label: 'Riwayat' }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b flex flex-col items-center">
        <div className="w-24 h-24 mb-4 rounded-full border-2 border-border bg-secondary flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Photo</p>
        </div>
        <p className="text-sm text-center text-foreground font-medium">{userName}</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={currentView === item.id ? 'w-full justify-center bg-secondary text-foreground' : 'w-full justify-center text-foreground'}
              onClick={() => onViewChange(item.id)}
            >
              {item.label}
            </Button>
          ))}
          {isOwner && (
            <Button
              variant="ghost"
              className="w-full justify-center text-destructive hover:text-destructive/80"
              onClick={() => setShowDeleteDialog(true)}
            >
              Hapus Perusahaan
            </Button>
          )}
        </div>
      </nav>

      <div className="p-4 space-y-2">
        {onBackToHome && (
          <Button
            variant="ghost"
            className="w-full justify-center text-foreground"
            onClick={onBackToHome}
          >
            Kembali ke Home
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-center text-destructive hover:text-destructive/80"
          onClick={onLogout}
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-48">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Perusahaan?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Semua data perusahaan, termasuk paket dan kurir akan dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-48 z-40">
        <SidebarContent />
      </aside>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Perusahaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua data perusahaan, termasuk paket dan kurir akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
