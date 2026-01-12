import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { List } from '@phosphor-icons/react'
import { User, Company } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

type CourierView = 'home' | 'package-list' | 'recommendation' | 'update'

interface CourierSidebarProps {
  user: User
  currentView: CourierView
  onViewChange: (view: CourierView) => void
  onLogout: () => void
  onBackToHome?: () => void
}

export default function CourierSidebar({ user, currentView, onViewChange, onLogout, onBackToHome }: CourierSidebarProps) {
  const isMobile = useIsMobile()
  const [companies, setCompanies] = useState<Company[]>([])
const [loadingCompanies, setLoadingCompanies] = useState(true)

  const activeUser = currentUser || user
  const userName = activeUser.name || activeUser.email.split('@')[0]
  const currentCompany = (companies || []).find(c => c.id === activeUser.companyId)
  const companyExists = !!currentCompany

  const userCompanies = (activeUser.companies || [])
    .map((membership) => {
      const company = (companies || []).find((c) => c.id === membership.companyId)
      return company ? { ...company, role: membership.role, joinedAt: membership.joinedAt } : null
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime())

  const handleCompanyClick = (companyId: string, role: string) => {
    if (companyId === activeUser.companyId) {
      return
    }

    setCurrentUser((prev) => {
      if (!prev) return null
      return { ...prev, companyId, role: role as any }
    })

    setUsers((prevUsers) => 
      (prevUsers || []).map(u => {
        if (u.id === activeUser.id) {
          return { ...u, companyId, role: role as any }
        }
        return u
      })
    )

    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

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

      {!companyExists && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <p className="text-xs text-destructive text-center mb-2">
            Perusahaan ini sudah dihapus
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onBackToHome}
          >
            Kembali ke Home
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <nav className="p-4">
            <div className="space-y-2 mb-4">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={currentView === item.id ? 'w-full justify-center bg-secondary text-foreground' : 'w-full justify-center text-foreground'}
                  onClick={() => onViewChange(item.id)}
                  disabled={!companyExists}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            {userCompanies.length > 1 && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2 px-2">Perusahaan Lainnya</p>
                <div className="space-y-1">
                  {userCompanies
                    .filter(c => c.id !== activeUser.companyId)
                    .map((company) => (
                      <Button
                        key={company.id}
                        variant="ghost"
                        className="w-full justify-center text-foreground text-sm"
                        onClick={() => handleCompanyClick(company.id, company.role)}
                      >
                        {company.name}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </nav>
        </ScrollArea>
      </div>

      <div className="p-4 space-y-2 border-t">
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
      </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 z-40">
      <SidebarContent />
    </aside>
  )
}
