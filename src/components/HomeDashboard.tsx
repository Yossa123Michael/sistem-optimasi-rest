import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Company } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { List } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
  onNavigate: (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode') => void
}

function HomeDashboard({ user, onLogout, onNavigate }: HomeDashboardProps) {
  const [companies] = useKV<Company[]>('companies', [])
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userCompanies = (companies || []).filter(
    (company) => company.ownerId === user.id || 
    (companies || []).some(c => c.id === user.companyId)
  )

  const hasCompanies = userCompanies.length > 0

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="flex flex-col items-center gap-4 p-6 border-b border-border">
        <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">Photo</span>
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-foreground">{user.name || user.email}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-base h-auto py-3"
          onClick={() => {
            onNavigate('home')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Home
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-base h-auto py-3"
          onClick={() => {
            onNavigate('companies')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          {hasCompanies ? 'List perusahaan' : 'Buat/Gabung perusahaan'}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-base h-auto py-3"
          onClick={() => {
            onNavigate('track-package')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Cek paket
        </Button>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-base h-auto py-3"
          onClick={() => {
            onLogout()
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {isMobile ? (
        <>
          <div className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center px-4 z-10">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <h1 className="ml-4 text-lg font-medium">{user.name || user.email}</h1>
          </div>
          <main className="flex-1 overflow-y-auto pt-16">
            <div className="p-6 max-w-2xl mx-auto space-y-4">
              <Card className="border-2">
                <CardContent className="p-8">
                  <h2 className="text-xl text-center text-foreground">
                    Halo, {user.name || user.email}
                  </h2>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 text-base border-2"
                      onClick={() => onNavigate('create-company')}
                    >
                      Buat Perusahaan
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 text-base border-2"
                      onClick={() => onNavigate('join-company')}
                    >
                      Gabung Perusahaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <Button
                    variant="outline"
                    className="w-full h-24 text-base border-2"
                    onClick={() => onNavigate('customer-mode')}
                  >
                    Sebagai Customer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </>
      ) : (
        <>
          <aside className="w-48 flex-shrink-0">
            <SidebarContent />
          </aside>

          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-8 max-w-3xl mx-auto space-y-6">
              <Card className="border-2">
                <CardContent className="p-10">
                  <h2 className="text-2xl text-center text-foreground">
                    Halo, {user.name || user.email}
                  </h2>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-28 text-lg border-2"
                      onClick={() => onNavigate('create-company')}
                    >
                      Buat Perusahaan
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-28 text-lg border-2"
                      onClick={() => onNavigate('join-company')}
                    >
                      Gabung Perusahaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-8">
                  <Button
                    variant="outline"
                    className="w-full h-28 text-lg border-2"
                    onClick={() => onNavigate('customer-mode')}
                  >
                    Sebagai Customer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </>
      )}
    </div>
  )
}

export default HomeDashboard
