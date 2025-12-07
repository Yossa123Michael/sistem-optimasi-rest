import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Company } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { List, Buildings, UserPlus } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
  onNavigate: (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode' | 'admin-dashboard' | 'courier-dashboard') => void
}

function HomeDashboard({ user, onLogout, onNavigate }: HomeDashboardProps) {
  const [companies] = useKV<Company[]>('companies', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeUser = currentUser || user

  const userCompanies = (activeUser.companies || [])
    .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    .map((membership) => {
      const company = (companies || []).find((c) => c.id === membership.companyId)
      return company ? { ...company, role: membership.role } : null
    })
    .filter((c) => c !== null)

  const [showCompanyOptions, setShowCompanyOptions] = useState(false)

  const handleCompanyClick = (companyId: string, role: string) => {
    setCurrentUser((prev) => {
      if (!prev) return null
      return { ...prev, companyId, role: role as any }
    })
    
    if (role === 'admin') {
      onNavigate('admin-dashboard')
    } else if (role === 'courier') {
      onNavigate('courier-dashboard')
    }
    
    if (isMobile) setSidebarOpen(false)
  }

  const handleCreateCompany = () => {
    setShowCompanyOptions(false)
    onNavigate('create-company')
    if (isMobile) setSidebarOpen(false)
  }

  const handleJoinCompany = () => {
    setShowCompanyOptions(false)
    onNavigate('join-company')
    if (isMobile) setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      <div className="flex flex-col items-center gap-3 p-6 pt-8 relative">
        <div className="w-24 h-24 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background text-muted-foreground/40">
          <span className="text-sm">Photo</span>
        </div>
        <div className="text-center">
          <p className="text-base text-primary font-medium">
            {activeUser.name || activeUser.email.split('@')[0]}
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

        {userCompanies.map((company) => (
          <button
            key={company.id}
            className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
            onClick={() => handleCompanyClick(company.id, company.role)}
          >
            {company.name}
          </button>
        ))}

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
    <>
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
              <h1 className="ml-4 text-lg font-medium">{activeUser.name || activeUser.email}</h1>
            </div>
            <main className="flex-1 overflow-y-auto pt-16">
              <div className="p-6 max-w-2xl mx-auto space-y-4">
                <Card className="rounded-3xl border-muted-foreground/20">
                  <CardContent className="p-8">
                    <h2 className="text-lg text-center text-muted-foreground">
                      Halo, ({activeUser.name || activeUser.email.split('@')[0]})
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

            <main className="flex-1 overflow-y-auto bg-background flex items-center justify-center">
              <div className="w-full max-w-2xl px-8 space-y-6">
                <Card className="rounded-3xl border-muted-foreground/20 shadow-sm">
                  <CardContent className="p-10">
                    <h2 className="text-xl text-center text-muted-foreground">
                      Halo, ({activeUser.name || activeUser.email.split('@')[0]})
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

      <Dialog open={showCompanyOptions} onOpenChange={setShowCompanyOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Aksi</DialogTitle>
            <DialogDescription>
              Apakah Anda ingin membuat perusahaan baru atau bergabung dengan perusahaan yang sudah ada?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleCreateCompany}
              className="w-full h-16 text-base"
            >
              <Buildings className="mr-2" size={24} />
              Buat Perusahaan
            </Button>
            <Button
              onClick={handleJoinCompany}
              variant="outline"
              className="w-full h-16 text-base"
            >
              <UserPlus className="mr-2" size={24} />
              Gabung Perusahaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default HomeDashboard
