import { useEffect, useMemo, useState } from 'react'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { ScrollArea } from './ui/scroll-area'
import { List, Buildings, UserPlus } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
  onUserUpdate: (user: User) => void
  onNavigate: (
    screen:
      | 'home'
      | 'companies'
      | 'track-package'
      | 'create-company'
      | 'join-company'
      | 'customer-mode'
      | 'admin-dashboard'
      | 'courier-dashboard',
  ) => void
  refreshKey?: number
}

type CompanyWithRole = Company & { role: UserRole; joinedAt: string }

function safeISO(input: any) {
  if (!input) return new Date().toISOString()
  if (typeof input === 'string') return input
  if (typeof input?.toDate === 'function') return input.toDate().toISOString()
  return new Date().toISOString()
}

export default function HomeDashboard({
  user,
  onLogout,
  onUserUpdate,
  onNavigate,
  refreshKey = 0,
}: HomeDashboardProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const snap = await getDocs(collection(db, 'companies'))
        setCompanies(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
      } finally {
        setLoadingCompanies(false)
      }
    }
    loadCompanies()
  }, [refreshKey])

  // MODE A: join + owned
  const userCompanies: CompanyWithRole[] = useMemo(() => {
    const memberships = user.companies || []

    const joined = memberships
      .map(m => {
        const c = companies.find(x => x.id === m.companyId)
        if (!c) return null
        return { ...c, role: m.role, joinedAt: safeISO(m.joinedAt) }
      })
      .filter(Boolean) as CompanyWithRole[]

    const owned = companies
      .filter(c => c.ownerId === user.id)
      .map(c => ({ ...c, role: 'admin' as UserRole, joinedAt: safeISO(c.createdAt) }))

    const map = new Map<string, CompanyWithRole>()
    for (const c of [...joined, ...owned]) {
      if (!map.has(c.id)) map.set(c.id, c)
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    )
  }, [companies, user.companies, user.id])

  const handleCompanyClick = async (companyId: string, role: UserRole) => {
    // simpan pilihan aktif
    await setDoc(doc(db, 'users', user.id), { companyId, role }, { merge: true })
    onUserUpdate({ ...user, companyId, role })

    const target = role === 'admin' ? 'admin-dashboard' : 'courier-dashboard'
    onNavigate(target)

    if (isMobile) setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-card">
      <div className="flex flex-col items-center gap-3 p-6 pt-8 flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background text-muted-foreground/40">
          <span className="text-sm">Photo</span>
        </div>
        <div className="text-center">
          <p className="text-base text-primary font-medium">
            {user.name || user.email.split('@')[0]}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 min-h-0">
        <nav className="py-4 space-y-2">
          <button
            className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
            onClick={() => {
              onNavigate('home')
              if (isMobile) setSidebarOpen(false)
            }}
          >
            Home
          </button>

          <div className="pt-2">
            {loadingCompanies ? (
              <p className="text-xs text-muted-foreground py-2">Memuat perusahaan...</p>
            ) : userCompanies.length > 0 ? (
              userCompanies.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
                  onClick={() => handleCompanyClick(c.id, c.role)}
                >
                  {c.name}
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                Anda belum punya perusahaan. Buat atau gabung dulu.
              </p>
            )}
          </div>

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
      </ScrollArea>

      <div className="px-6 pb-8 pt-4 border-t flex-shrink-0">
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
          <div className="p-6 max-w-2xl mx-auto space-y-6">
            <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-8">
                <h2 className="text-xl text-center font-medium text-foreground">
                  Halo, <span className="text-primary">{user.name || user.email.split('@')[0]}</span>
                </h2>
                <p className="text-center text-muted-foreground text-sm mt-2">
                  Selamat datang kembali di RouteOptima
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Buildings className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">Buat Perusahaan</h3>
                      <p className="text-xs text-muted-foreground">Buat perusahaan dan kelola bisnis Anda</p>
                    </div>
                    <Button
                      onClick={() => onNavigate('create-company')}
                      className="w-full h-11 rounded-xl text-sm"
                    >
                      Mulai Buat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-accent/5 to-accent/10">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                      <UserPlus className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">Gabung Perusahaan</h3>
                      <p className="text-xs text-muted-foreground">Bergabung sebagai admin atau kurir</p>
                    </div>
                    <Button
                      onClick={() => onNavigate('join-company')}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-accent/30 hover:bg-accent/10 text-sm"
                    >
                      Gabung Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <h3 className="text-base font-semibold text-foreground">Mode Customer</h3>
                    <p className="text-xs text-muted-foreground">Lacak dan kelola pesanan Anda</p>
                    <Button
                      onClick={() => onNavigate('customer-mode')}
                      variant="outline"
                      className="w-full h-11 rounded-xl text-sm"
                    >
                      Masuk sebagai Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    ) : (
      <>
        <aside className="w-64 flex-shrink-0 border-r border-border bg-card">
          <SidebarContent />
        </aside>

        <main className="flex-1 overflow-y-auto bg-background flex items-center justify-center p-8">
          <div className="w-full max-w-3xl space-y-8">
            <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-12">
                <h2 className="text-2xl text-center font-medium text-foreground">
                  Halo, <span className="text-primary">{user.name || user.email.split('@')[0]}</span>
                </h2>
                <p className="text-center text-muted-foreground mt-2">
                  Selamat datang kembali di RouteOptima
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Buildings className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Buat Perusahaan</h3>
                      <p className="text-sm text-muted-foreground">
                        Buat perusahaan dan kelola bisnis Anda
                      </p>
                    </div>
                    <Button
                      onClick={() => onNavigate('create-company')}
                      className="w-full h-12 rounded-xl"
                    >
                      Mulai Buat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-accent/5 to-accent/10">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                      <UserPlus className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Gabung Perusahaan</h3>
                      <p className="text-sm text-muted-foreground">
                        Bergabung sebagai admin atau kurir
                      </p>
                    </div>
                    <Button
                      onClick={() => onNavigate('join-company')}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-accent/30 hover:bg-accent/10"
                    >
                      Gabung Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Mode Customer</h3>
                  <p className="text-sm text-muted-foreground">Lacak dan kelola pesanan Anda</p>
                  <Button
                    onClick={() => onNavigate('customer-mode')}
                    variant="outline"
                    className="w-full max-w-md h-12 rounded-xl"
                  >
                    Masuk sebagai Customer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    )}
  </div>
)
}