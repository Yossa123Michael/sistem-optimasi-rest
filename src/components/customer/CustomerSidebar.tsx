import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { List } from '@phosphor-icons/react'
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKV } from '@github/spark/hooks'

type CustomerView = 'home' | 'orders' | 'track'

interface CustomerSidebarProps {
  user: User
  currentView: CustomerView
  onViewChange: (view: CustomerView) => void
  onLogout: () => void
}

export default function CustomerSidebar({ user, currentView, onViewChange, onLogout }: CustomerSidebarProps) {
  const isMobile = useIsMobile()
  const [companies] = useKV<Company[]>('companies', [])

  const userCompanies = (user.companies || [])
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    .map((membership) => {
      const company = (companies || []).find((c) => c.id === membership.companyId)
      return company ? { ...company, role: membership.role } : null
    })
    .filter((c) => c !== null)

  const userName = user.name || user.email.split('@')[0]

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
          <Button
            variant="ghost"
            className={currentView === 'home' ? 'w-full justify-center bg-secondary text-foreground' : 'w-full justify-center text-foreground'}
            onClick={() => onViewChange('home')}
          >
            Home
          </Button>

          {userCompanies.map((company) => (
            <Button
              key={company.id}
              variant="ghost"
              className="w-full justify-center text-foreground hover:bg-secondary"
            >
              {company.name}
            </Button>
          ))}

          <Button
            variant="ghost"
            className={currentView === 'orders' ? 'w-full justify-center bg-secondary text-foreground' : 'w-full justify-center text-foreground'}
            onClick={() => onViewChange('orders')}
          >
            Pesanan Saya
          </Button>

          <Button
            variant="ghost"
            className={currentView === 'track' ? 'w-full justify-center bg-secondary text-foreground' : 'w-full justify-center text-foreground'}
            onClick={() => onViewChange('track')}
          >
            Cek paket
          </Button>
        </div>
      </nav>

      <div className="p-4">
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
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 z-40">
      <SidebarContent />
    </aside>
  )
}
