import { User } from '@/lib/types'
import { Button } from '@/components/ui/button'

type CustomerView = 'home' | 'pemesanan' | 'status' | 'history'

interface CustomerSidebarProps {
  user: User
  currentView: CustomerView
  onViewChange: (v: CustomerView) => void
  onLogout: () => void
  onBackToHome?: () => void
}

export default function CustomerSidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
  onBackToHome,
}: CustomerSidebarProps) {
  const userName = user.name || user.email.split('@')[0]

  const Item = ({ id, label }: { id: CustomerView; label: string }) => (
    <button
      onClick={() => onViewChange(id)}
      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
        currentView === id ? 'bg-secondary' : 'hover:bg-secondary/50'
      }`}
    >
      {label}
    </button>
  )

  return (
    <aside className="hidden lg:flex w-48 fixed inset-y-0 left-0 border-r bg-card">
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col items-center gap-3 p-6 pt-8 flex-shrink-0">
          <div className="w-24 h-24 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background text-muted-foreground/40">
            <span className="text-sm">Photo</span>
          </div>
          <div className="text-center">
            <p className="text-base text-primary font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">Customer</p>
          </div>
        </div>

        <nav className="px-3 space-y-2">
          <Item id="home" label="Home" />
          <Item id="pemesanan" label="Pemesanan" />
          <Item id="status" label="Status Paket" />
          <Item id="history" label="History" />
        </nav>

        <div className="mt-auto p-3 space-y-2">
          {onBackToHome && (
            <Button variant="ghost" className="w-full" onClick={onBackToHome}>
              Kembali ke Home
            </Button>
          )}
          <Button variant="ghost" className="w-full text-destructive" onClick={onLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  )
}