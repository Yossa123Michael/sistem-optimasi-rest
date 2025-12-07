import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List } from '@phosphor-icons/react'
import { User } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'

type CourierView = 'home' | 'package-list' | 'recommendation' | 'update'

interface CourierSidebarProps {
  user: User
  currentView: CourierView
  onViewChange: (view: CourierView) => void
  onLogout: () => void
}

export default function CourierSidebar({ user, currentView, onViewChange, onLogout }: CourierSidebarProps) {
  const isMobile = useIsMobile()
  
  const userName = user.name || user.email.split('@')[0]

  const menuItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'package-list' as const, label: 'Daftar Paket' },
    { id: 'recommendation' as const, label: 'Rekomendasi Rute' },
    { id: 'update' as const, label: 'Update Status' }
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
        </div>
      </nav>

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-center text-foreground"
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
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 z-40">
      <SidebarContent />
    </aside>
  )
}
