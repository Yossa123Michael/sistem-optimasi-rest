import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { List } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'

export type AdminView =
  | 'overview'
  | 'input-data'
  | 'monitoring'
  | 'history'
  | 'requests'

interface AdminSidebarProps {
  user: User
  company: Company
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  onLogout: () => void
}

export default function AdminSidebar2({
  user,
  company,
  currentView,
  onViewChange,
  onLogout,
}: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const userName = user.name || user.email.split('@')[0]

  const handleDeleteCompany = () => {
    toast.error('Fitur hapus perusahaan belum diimplementasikan.')
    setShowDeleteDialog(false)
  }

  const menuItems: { id: AdminView; label: string }[] = [
    { id: 'overview', label: 'Home' },
    { id: 'input-data', label: 'Input Data' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'history', label: 'History' },
    { id: 'requests', label: 'Permintaan Karyawan' },
  ]

  const SidebarInner = () => (
    <div className="flex h-screen w-full flex-col bg-white border-r border-slate-200 rounded-tr-[40px]">
      {/* Header foto + nama */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border border-slate-300 flex items-center justify-center text-sm text-slate-400 mb-4 bg-slate-50">
          Photo
        </div>
        <div className="text-sm font-semibold text-slate-900 text-center">
          {userName}
        </div>
        <div className="text-xs text-slate-500 mt-1">{company.name}</div>
      </div>

      {/* Scrollable menu */}
      <ScrollArea className="flex-1">
        <nav className="px-8 py-6 flex flex-col items-stretch gap-1 text-sm text-slate-700">
          <div className="border-t border-slate-200 mb-3" />
          {menuItems.map(item => {
            const active = currentView === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={[
                  'py-2 text-center rounded-full transition-colors',
                  active
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
          <div className="border-t border-slate-200 mt-4 mb-3" />
          <button
            type="button"
            onClick={onLogout}
            className="py-2 text-center text-sm text-red-500 hover:text-red-600"
          >
            Sign Out
          </button>
        </nav>
      </ScrollArea>

      {/* Dialog hapus perusahaan (nanti bisa dihubungkan ke Firestore) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Perusahaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Fitur hapus perusahaan belum diimplementasikan penuh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  // Versi mobile: sidebar jadi drawer
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-slate-900">RouteOptima</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <List size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <SidebarInner />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop: sidebar tetap di kiri dan full height, scroll di dalam menu
  return (
    <aside className="w-64">
      <SidebarInner />
    </aside>
  )
}