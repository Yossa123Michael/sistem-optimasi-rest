import { useState } from 'react'
import { List } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { User, Company, Package, Courier } from '@/lib/types'

export type AdminView = 'overview' | 'input-data' | 'requests'

interface AdminSidebarProps {
  user: User
  company: Company
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  onLogout: () => void
  onBackToHome?: () => void
  isOwner: boolean
}

export default function AdminSidebar({
  user,
  company,
  currentView,
  onViewChange,
  onLogout,
  onBackToHome,
  isOwner,
}: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [packages, setPackages] = useKV<Package[]>('packages', [])
  const [couriers, setCouriers] = useKV<Courier[]>('couriers', [])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // --- data aktif: user + company ---

  const activeUser = currentUser || user
  const userName = activeUser.name || activeUser.email.split('@')[0]

  const companyExists = true

  const userCompanies = (activeUser.companies || [])
    .map(m => {
      const comp = (companies || []).find(c => c.id === m.companyId)
      return comp
        ? { ...comp, role: m.role, joinedAt: m.joinedAt }
        : null
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort(
      (a, b) =>
        new Date(a.joinedAt || 0).getTime() -
        new Date(b.joinedAt || 0).getTime(),
    )

  // --- aksi hapus perusahaan (masih pakai KV) ---

  const handleDeleteCompany = () => {
    if (!activeUser.companyId || !isOwner || !companyExists) return

    const companyIdToDelete = activeUser.companyId

    setCompanies(prev => (prev || []).filter(c => c.id !== companyIdToDelete))

    setUsers(prev =>
      (prev || []).map(u => ({
        ...u,
        companies: (u.companies || []).filter(
          m => m.companyId !== companyIdToDelete,
        ),
        companyId: u.companyId === companyIdToDelete ? undefined : u.companyId,
        role: u.companyId === companyIdToDelete ? undefined : u.role,
      })),
    )

    setPackages(prev =>
      (prev || []).filter(p => p.companyId !== companyIdToDelete),
    )

    setCouriers(prev =>
      (prev || []).filter(c => c.companyId !== companyIdToDelete),
    )

    setCurrentUser(prev => {
      if (!prev) return null
      if (prev.companyId !== companyIdToDelete) return prev
      return { ...prev, companyId: undefined, role: undefined }
    })

    toast.success('Perusahaan berhasil dihapus')
    setShowDeleteDialog(false)

    if (onBackToHome) onBackToHome()
  }

  // --- ganti perusahaan aktif (multi-company) ---

  const handleCompanyClick = (companyId: string, role: string) => {
    if (companyId === activeUser.companyId) return

    setCurrentUser(prev => {
      if (!prev) return null
      return { ...prev, companyId, role: role as any }
    })

    setUsers(prev =>
      (prev || []).map(u =>
        u.id === activeUser.id ? { ...u, companyId, role: role as any } : u,
      ),
    )

    toast.success('Perusahaan aktif berhasil diubah')
  }

  // --- menu di sidebar admin ---

  const menuItems: { id: AdminView; label: string }[] = [
    { id: 'overview', label: 'Home' },
    { id: 'input-data', label: 'Input Data Paket' },
    // permintaan karyawan difilter pakai isOwner di bawah
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header user */}
      <div className="p-6 border-b flex flex-col items-center">
        <div className="w-24 h-24 mb-4 rounded-full border-2 border-border bg-secondary flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Photo</p>
        </div>
        <p className="text-sm text-center text-foreground font-medium">
          {userName}
        </p>
      </div>

      {/* Banner jika company di KV sudah tidak ada */}
      {!companyExists && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <p className="text-xs text-destructive text-center mb-2">
            Perusahaan ini sudah dihapus
          </p>

          {onBackToHome && (
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={onBackToHome}
            >
              Ke layar utama
            </Button>
          )}
        </div>
      )}

      {/* Menu utama */}
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <nav className="p-4">
            <div className="space-y-2 mb-4">
              {menuItems.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={
                    currentView === item.id
                      ? 'w-full justify-center bg-secondary text-foreground'
                      : 'w-full justify-center text-foreground'
                  }
                  onClick={() => onViewChange(item.id)}
                  disabled={!companyExists}
                >
                  {item.label}
                </Button>
              ))}

              {/* Menu Permintaan hanya untuk owner */}
              {isOwner && (
                <Button
                  key="requests"
                  variant="ghost"
                  className={
                    currentView === 'requests'
                      ? 'w-full justify-center bg-secondary text-foreground'
                      : 'w-full justify-center text-foreground'
                  }
                  onClick={() => onViewChange('requests')}
                  disabled={!companyExists}
                >
                  Permintaan Karyawan
                </Button>
              )}
            </div>

            {/* daftar perusahaan lain */}
            {userCompanies.length > 1 && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2 px-2">
                  Perusahaan Lainnya
                </p>
                <div className="space-y-1">
                  {userCompanies
                    .filter(c => c.id !== activeUser.companyId)
                    .map(comp => (
                      <Button
                        key={comp.id}
                        variant="ghost"
                        className="w-full justify-center text-foreground text-sm"
                        onClick={() =>
                          handleCompanyClick(comp.id, comp.role as any)
                        }
                      >
                        {comp.name}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Tombol hapus perusahaan hanya untuk owner & companyExists */}
            {isOwner && companyExists && (
              <div className="border-t pt-4 mt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-destructive hover:text-destructive/80"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Hapus Perusahaan
                </Button>
              </div>
            )}
          </nav>
        </ScrollArea>
      </div>

      {/* Footer: back & sign out */}
      <div className="p-4 space-y-2 border-t">
        {onBackToHome && companyExists && (
          <Button
            variant="ghost"
            className="w-full justify-center text-foreground"
            onClick={onBackToHome}
          >
            Ke layar utama
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

  // --- Render mobile vs desktop ---

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
            <SheetContent side="left" className="p-0 w-56">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Perusahaan?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Semua data perusahaan,
                termasuk paket dan kurir akan dihapus secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCompany}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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
              Tindakan ini tidak dapat dibatalkan. Semua data perusahaan,
              termasuk paket dan kurir akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}