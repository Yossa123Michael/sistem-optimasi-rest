import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Company, UserRole } from '@/lib/types'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { List, Buildings, UserPlus } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
  onNavigate: (screen: 'home' | 'companies' | 'track-package' | 'create-company' | 'join-company' | 'customer-mode' | 'admin-dashboard' | 'courier-dashboard') => void
  refreshKey?: number
}

function HomeDashboard({ user, onLogout, onNavigate, refreshKey = 0 }: HomeDashboardProps) {
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companiesLoaded, setCompaniesLoaded] = useState(false)
  const [showCompanyOptions, setShowCompanyOptions] = useState(false)
  const isNavigatingRef = useRef(false)

  const activeUser = currentUser || user

  useEffect(() => {
    const loadData = async () => {
      console.log('HomeDashboard loading data, refreshKey:', refreshKey)
      
      try {
        const companiesData = await window.spark.kv.get<Company[]>('companies')
        const currentUserData = await window.spark.kv.get<User | null>('current-user')
        const usersData = await window.spark.kv.get<User[]>('users')
        
        console.log('Loaded companies from KV:', companiesData?.length || 0)
        console.log('Companies:', companiesData)
        console.log('Loaded current user from KV:', currentUserData?.email)
        console.log('Current user companies:', currentUserData?.companies)
        
        if (companiesData) {
          setCompanies(companiesData)
        }
        
        if (currentUserData && currentUserData.id === activeUser.id) {
          setCurrentUser(currentUserData)
        }
        
        if (usersData) {
          setUsers(usersData)
        }
        
        setCompaniesLoaded(true)
      } catch (error) {
        console.error('Error loading data:', error)
        setCompaniesLoaded(true)
      }
    }
    loadData()
  }, [refreshKey])

  const userCompanies = companiesLoaded 
    ? (activeUser.companies || [])
        .map((membership) => {
          const company = (companies || []).find((c) => c.id === membership.companyId)
          if (!company) {
            console.warn('Company not found for membership:', membership.companyId, 'in companies:', companies)
          } else {
            console.log('Found company for membership:', company.name, company.id)
          }
          return company ? { ...company, role: membership.role, joinedAt: membership.joinedAt } : null
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime())
    : []
  
  console.log('HomeDashboard render:', { 
    companiesLoaded, 
    activeUserEmail: activeUser.email,
    activeUserHasMemberships: activeUser.companies?.length || 0,
    activeUserMemberships: activeUser.companies,
    userCompaniesFound: userCompanies.length,
    userCompanies: userCompanies.map(c => ({ name: c.name, id: c.id, role: c.role })),
    companiesInDB: companies?.length || 0,
    allCompaniesInDB: companies?.map(c => ({ name: c.name, id: c.id }))
  })

  const handleCompanyClick = async (companyId: string, role: string) => {
    try {
      if (isNavigatingRef.current) {
        console.log('Navigation already in progress, skipping')
        return
      }
      
      isNavigatingRef.current = true
      console.log('=== Handling company click ===')
      console.log('Company ID:', companyId)
      console.log('Role:', role)
      
      const allCompanies = await window.spark.kv.get<Company[]>('companies')
      const company = (allCompanies || []).find(c => c.id === companyId)
      
      if (!company) {
        console.error('Company not found', { companyId })
        toast.error('Perusahaan tidak ditemukan')
        isNavigatingRef.current = false
        return
      }
      
      console.log('Company found:', company.name)
      
      const freshUser = await window.spark.kv.get<User | null>('current-user')
      
      if (!freshUser) {
        toast.error('Sesi pengguna tidak ditemukan')
        isNavigatingRef.current = false
        return
      }
      
      console.log('Current user:', freshUser.email)
      
      const updatedUser = { ...freshUser, companyId, role: role as UserRole }
      console.log('Updating user with companyId and role:', { companyId, role })
      
      await window.spark.kv.set('current-user', updatedUser)
      console.log('User saved to KV with companyId:', updatedUser.companyId, 'and role:', updatedUser.role)
      
      const allUsers = await window.spark.kv.get<User[]>('users')
      const updatedUsers = (allUsers || []).map(u => 
        u.id === freshUser.id ? updatedUser : u
      )
      await window.spark.kv.set('users', updatedUsers)
      console.log('Users array updated in KV')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verifyUser = await window.spark.kv.get<User | null>('current-user')
      console.log('Verification - User in KV has companyId:', verifyUser?.companyId, 'and role:', verifyUser?.role)
      
      if (!verifyUser?.companyId || !verifyUser?.role) {
        console.error('Failed to verify user data after save')
        toast.error('Gagal menyimpan data pengguna')
        isNavigatingRef.current = false
        return
      }
      
      if (isMobile) setSidebarOpen(false)
      
      console.log('=== Navigating to dashboard ===')
      const targetScreen = role === 'admin' ? 'admin-dashboard' : 'courier-dashboard'
      console.log('Target screen:', targetScreen)
      console.log('Calling onNavigate with verified user data...')
      
      onNavigate(targetScreen)
      
      console.log('onNavigate called successfully')
      
      setTimeout(() => {
        isNavigatingRef.current = false
      }, 1500)
      
    } catch (error) {
      console.error('Error handling company click:', error)
      toast.error('Terjadi kesalahan')
      isNavigatingRef.current = false
    }
  }

  const handleCreateCompany = () => {
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
      <div className="flex flex-col items-center gap-3 p-6 pt-8 relative flex-shrink-0">
        <div className="w-24 h-24 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background text-muted-foreground/40">
          <span className="text-sm">Photo</span>
        </div>
        <div className="text-center">
          <p className="text-base text-primary font-medium">
            {activeUser.name || activeUser.email.split('@')[0]}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
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

          {companiesLoaded && userCompanies.length > 0 && (
            userCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                className="w-full text-left text-base text-muted-foreground py-3 hover:text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  console.log('Company button clicked:', { 
                    name: company.name, 
                    id: company.id, 
                    role: company.role,
                    allCompanies: companies
                  })
                  handleCompanyClick(company.id, company.role)
                }}
              >
                {company.name}
              </button>
            ))
          )}

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
      </ScrollArea>

      <div className="px-6 pb-8 flex-shrink-0">
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
              <div className="p-6 max-w-2xl mx-auto space-y-6">
                <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-card to-card/50">
                  <CardContent className="p-8">
                    <h2 className="text-xl text-center font-medium text-foreground">
                      Halo, <span className="text-primary">{activeUser.name || activeUser.email.split('@')[0]}</span>
                    </h2>
                    <p className="text-center text-muted-foreground text-sm mt-2">Selamat datang kembali di RouteOptima</p>
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
                      Halo, <span className="text-primary">{activeUser.name || activeUser.email.split('@')[0]}</span>
                    </h2>
                    <p className="text-center text-muted-foreground mt-2">Selamat datang kembali di RouteOptima</p>
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
                          <p className="text-sm text-muted-foreground">Buat perusahaan dan kelola bisnis Anda</p>
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
                          <p className="text-sm text-muted-foreground">Bergabung sebagai admin atau kurir</p>
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