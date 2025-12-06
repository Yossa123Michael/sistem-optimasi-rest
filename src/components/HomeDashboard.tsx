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
    (company) => company.ownerId === user.id || company.id === user.companyId
  )

  const hasCompanies = userCompanies.length > 0

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="flex flex-col items-center gap-3 p-6 pt-8 relative">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
        <div className="w-24 h-24 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background text-muted-foreground/40">
          <span className="text-sm">Photo</span>
        </div>
        <div className="text-center">
          <p className="text-base text-primary font-medium">
            {user.name || user.email.split('@')[0]}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-6 py-4 space-y-2">
        <button
          className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
          onClick={() => {
            onNavigate('home')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Home
        </button>

        <button
          className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
          onClick={() => {
            onNavigate('companies')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          {hasCompanies ? 'List perusahaan' : 'Buat/Gabung perusahaan'}
        </button>

        <button
          className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
          onClick={() => {
            onNavigate('home')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Pesanan Saya
        </button>

        <button
          className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
          onClick={() => {
            onNavigate('track-package')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Cek paket
        </button>
      </nav>

      <div className="px-6 pb-8">
        <button
          className="w-full text-left text-base text-destructive py-3 hover:text-destructive/80 transition-colors"
          onClick={() => {
            onLogout()
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
              <Card className="rounded-3xl border-muted-foreground/20">
                <CardContent className="p-8">
                  <h2 className="text-lg text-center text-muted-foreground">
                    Halo, ({user.name || user.email.split('@')[0]})
                  </h2>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-muted-foreground/20">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 text-base rounded-2xl border-muted-foreground/20 hover:bg-muted/50"
                      onClick={() => onNavigate('create-company')}
                    >
                      Buat Perusahaan
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 text-base rounded-2xl border-muted-foreground/20 hover:bg-muted/50"
                      onClick={() => onNavigate('join-company')}
                    >
                      Gabung<br />Perusahaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-muted-foreground/20">
                <CardContent className="p-6">
                  <Button
                    variant="outline"
                    className="w-full h-24 text-base rounded-2xl border-muted-foreground/20 hover:bg-muted/50"
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
          <aside className="w-64 flex-shrink-0 border-r border-border bg-card">
            <SidebarContent />
          </aside>

          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-12 max-w-3xl space-y-6">
              <Card className="rounded-3xl border-muted-foreground/20 shadow-sm">
                <CardContent className="p-10">
                  <h2 className="text-xl text-center text-muted-foreground">
                    Halo, ({user.name || user.email.split('@')[0]})
                  </h2>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-muted-foreground/20 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-28 text-lg rounded-2xl border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground"
                      onClick={() => onNavigate('create-company')}
                    >
                      Buat Perusahaan
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-28 text-lg rounded-2xl border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground"
                      onClick={() => onNavigate('join-company')}
                    >
                      Gabung<br />Perusahaan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-muted-foreground/20 shadow-sm">
                <CardContent className="p-8">
                  <Button
                    variant="outline"
                    className="w-full h-28 text-lg rounded-2xl border-muted-foreground/20 hover:bg-muted/50 text-muted-foreground"
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
