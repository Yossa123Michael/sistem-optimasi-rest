import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
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
import { List } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'

export type AdminView =
  | 'overview'
  | 'input-data'
  | 'monitoring'
  | 'history'
  | 'requests'

interface AdminSidebar2Props {
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
}: AdminSidebar2Props) {
  const isMobile = useIsMobile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const userName = user.name || user.email?.split('@')[0] || 'Admin'

  const menuItems: { id: AdminView; label: string }[] = [
    { id: 'overview', label: 'Home' },
    { id: 'input-data', label: 'Input Data' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'history', label: 'History' },
    { id: 'requests', label: 'Permintaan Karyawan' }, // untuk owner approve apply
  ]

  const handleDeleteCompany = () => {
    toast.error('Fitur hapus perusahaan belum diimplementasikan.')
    setShowDeleteDialog(false)
  }

  const SidebarInner = () => (
    <div className="flex flex-col h-full bg-white border-r rounded-tr-3xl shadow-sm">
      {/* Header foto + nama */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center border-b">
        <div className="w-24 h-24 rounded-full border border-gray-300 flex items-center justify-center text-sm text-gray-400 mb-4">
          Photo
        </div>
        <div className="text-sm text-gray-800 font-medium">
          {userName}
        </div>
        <div className="text-xs text-gray-500 mt-1">{company.name}</div>
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1">
        <div className="px-10 py-6 flex flex-col items-stretch gap-2 text-sm text-gray-700">
          <div className="w-full border-t border-gray-200 mb-1" />
          {menuItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`py-1 text-center hover:text-gray-900 ${
                currentView === item.id ? 'font-semibold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="w-full border-t border-gray-200 mt-1 mb-2" />
          <button
            type="button"
            onClick={onLogout}
            className="py-1 text-center text-red-500 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </ScrollArea>

      {/* Dialog hapus perusahaan (kalau nanti dipakai) */}
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
            <AlertDialogAction onClick={handleDeleteCompany}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  // Versi mobile pakai Sheet
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">RouteOptima</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <List size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-56">
            <SidebarInner />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop: sidebar tetap di kiri
  return (
    <aside className="h-full w-52">
      <SidebarInner />
    </aside>
  )
}