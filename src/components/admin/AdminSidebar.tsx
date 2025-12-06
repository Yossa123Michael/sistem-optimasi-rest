import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  House, 
  PlusCircle, 
  Truck, 
  MonitorPlay, 
  ClockCounterClockwise, 
  SignOut,
  List
} from '@phosphor-icons/react'
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'

type AdminView = 'home' | 'input-data' | 'courier' | 'courier-activation' | 'monitoring' | 'history'

interface AdminSidebarProps {
  user: User
  currentView: AdminView
  onViewChange: (view: AdminView) => void
  onLogout: () => void
}

export default function AdminSidebar({ user, currentView, onViewChange, onLogout }: AdminSidebarProps) {
  const isMobile = useIsMobile()
  const [companies] = useKV<Company[]>('companies', [])
  
  const company = companies?.find(c => c.id === user.companyId)

  const menuItems = [
    { id: 'home' as const, label: 'Home', icon: House },
    { id: 'input-data' as const, label: 'Input Data', icon: PlusCircle },
    { id: 'courier' as const, label: 'Kurir', icon: Truck },
    { id: 'monitoring' as const, label: 'Monitoring', icon: MonitorPlay },
    { id: 'history' as const, label: 'History', icon: ClockCounterClockwise }
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {(user.name || user.email)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.name || user.email}</p>
            <p className="text-xs text-muted-foreground truncate">Admin</p>
          </div>
        </div>
        {company && (
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Perusahaan</p>
            <p className="font-medium text-sm">{company.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">Kode: {company.code}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onViewChange(item.id)}
            >
              <item.icon size={20} className="mr-3" weight={currentView === item.id ? 'fill' : 'regular'} />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <SignOut size={20} className="mr-3" />
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
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 z-40">
      <SidebarContent />
    </aside>
  )
}
