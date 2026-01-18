import { useEffect, useMemo, useState } from 'react'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { ScrollArea } from './ui/scroll-area'
import { List, Buildings, UserPlus } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
  onUserUpdate: (u: User | null) => void
  onNavigate: (screen: string) => void
  refreshKey?: number
}

type CompanyWithRole = Company & { role: UserRole; joinedAt: string }

type CompanyMember = {
  id: string
  companyId: string
  userId: string
  role: UserRole
  active?: boolean
  joinedAt?: string
  updatedAt?: string
}

function safeISO(input: any) {
  const s = String(input || '')
  const n = Date.parse(s)
  return Number.isFinite(n) ? new Date(n).toISOString() : new Date(0).toISOString()
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

  // ✅ NEW: memberships from companyMembers
  const [memberships, setMemberships] = useState<CompanyMember[]>([])
  const [loadingMemberships, setLoadingMemberships] = useState(true)

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true)
        const snap = await getDocs(collection(db, 'companies'))
        const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Company))

        // Soft delete: hanya tampilkan yang belum diarsipkan
        setCompanies(all.filter(c => !(c as any).archived))
      } finally {
        setLoadingCompanies(false)
      }
    }
    loadCompanies()
  }, [refreshKey])

  useEffect(() => {
    const loadMemberships = async () => {
      try {
        setLoadingMemberships(true)
        const snap = await getDocs(
          query(
            collection(db, 'companyMembers'),
            where('userId', '==', user.id),
            where('active', '==', true),
          ),
        )
        setMemberships(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as CompanyMember)))
      } finally {
        setLoadingMemberships(false)
      }
    }
    loadMemberships()
  }, [user.id, refreshKey])

  const userCompanies: CompanyWithRole[] = useMemo(() => {
    // joined from companyMembers
    const joined = memberships
      .map(m => {
        const c = companies.find(x => x.id === m.companyId)
        if (!c) return null
        return { ...c, role: m.role, joinedAt: safeISO(m.joinedAt || m.updatedAt) }
      })
      .filter(Boolean) as CompanyWithRole[]

    // owned tetap ditampilkan juga
    const owned = companies
      .filter(c => c.ownerId === user.id)
      .map(c => ({ ...c, role: 'admin' as UserRole, joinedAt: safeISO((c as any).createdAt) }))

    const map = new Map<string, CompanyWithRole>()
    for (const c of [...joined, ...owned]) {
      if (!map.has(c.id)) map.set(c.id, c)
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    )
  }, [companies, memberships, user.id])

  const handleCompanyClick = async (companyId: string, role: UserRole) => {
    await setDoc(doc(db, 'users', user.id), { companyId, role }, { merge: true })
    onUserUpdate({ ...user, companyId, role })

    const target = role === 'admin' ? 'admin-dashboard' : 'courier-dashboard'
    onNavigate(target)

    if (isMobile) setSidebarOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-screen bg-card">
      <div className="flex flex-col items-center gap-3 p-6 pt-8 flex-shrink-0">
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
            {(loadingCompanies || loadingMemberships) ? (
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
        </nav>
      </ScrollArea>

      <div className="px-6 pb-8 pt-4 border-t flex-shrink-0">
        <button
          className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
          onClick={() => {
            onNavigate('track-package')
            if (isMobile) setSidebarOpen(false)
          }}
        >
          Cek paket
        </button>

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

  // ===== Main content (sama seperti sebelumnya) =====
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">RouteOptima</h2>
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
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 border-r">
          <SidebarContent />
        </aside>
      )}

      {/* Body */}
      <main className={isMobile ? 'pt-20 p-4' : 'lg:ml-64 p-6'}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Beranda</h1>
            <p className="text-sm text-muted-foreground">
              Pilih perusahaan dari sidebar, atau buat/gabung perusahaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Buildings className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Buat Perusahaan</h3>
                    <p className="text-xs text-muted-foreground">Buat perusahaan baru sebagai owner/admin</p>
                  </div>
                  <Button onClick={() => onNavigate('create-company')} className="w-full h-12 rounded-xl">
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
                    <p className="text-xs text-muted-foreground">Bergabung sebagai admin atau kurir</p>
                  </div>
                  <Button onClick={() => onNavigate('join-company')} className="w-full h-12 rounded-xl">
                    Gabung
                  </Button>
                </div>
              </CardContent>
            </Card>

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
          
        </div>
      </main>
    </div>

    
  )
}