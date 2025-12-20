import { useEffect, useState, useMemo } from 'react'
import { Company, User, UserCompanyMembership } from '@/lib/types'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import {
  Building2,
  PackageSearch,
  Truck,
  Users,
  ArrowRight,
} from 'lucide-react'

interface HomeDashboardProps {
  user: User
  onLogout: () => void
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
  refreshKey: number
}

export default function HomeDashboard({
  user,
  onLogout,
  onNavigate,
  refreshKey,
}: HomeDashboardProps) {
  // Hanya simpan companies di KV; user dari props App.tsx
  const [companies, setCompanies] = useKV<Company[]>('companies', [])
  const [loading, setLoading] = useState(true)

  // 1. Load companies dari KV setiap refreshKey berubah
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const storedCompanies =
          (await window.spark.kv.get<Company[]>('companies')) || []
        setCompanies(storedCompanies)
      } catch (error) {
        console.error('Error loading data in HomeDashboard:', error)
        toast.error('Gagal memuat data dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshKey, setCompanies])

  // 2. Hitung membership user terhadap companies
  const {
    activeUserMemberships,
    activeUserHasMemberships,
    userCompaniesFound,
  } = useMemo(() => {
    const memberships = (user.companies || []) as UserCompanyMembership[]
    const hasMemberships = memberships.length > 0

    const companiesById = new Map<string, Company>()
    ;(companies || []).forEach(c => companiesById.set(c.id, c))

    const validMemberships = memberships.filter(m =>
      companiesById.has(m.companyId),
    )

    return {
      activeUserMemberships: validMemberships,
      activeUserHasMemberships: hasMemberships,
      userCompaniesFound: validMemberships.length,
    }
  }, [companies, user.companies])

  const handleCreateCompany = () => {
    onNavigate('create-company')
  }

  const handleJoinCompany = () => {
    onNavigate('join-company')
  }

  const handleTrackPackage = () => {
    onNavigate('track-package')
  }

  const handleCustomerMode = () => {
    onNavigate('customer-mode')
  }

  const handleCompanyClick = async (companyId: string, role: 'admin' | 'courier' | 'customer') => {
    try {
      const company = (companies || []).find(c => c.id === companyId)
      
      if (!company) {
        toast.error('Perusahaan tidak ditemukan')
        return
      }

      const currentUser = await window.spark.kv.get<User>('current-user')
      
      if (!currentUser) {
        toast.error('User tidak ditemukan')
        return
      }

      const updatedUser = { ...currentUser, companyId, role }
      await window.spark.kv.set('current-user', updatedUser)

      const allUsers = (await window.spark.kv.get<User[]>('users')) || []
      const updatedUsers = allUsers.map(u =>
        u.id === currentUser.id ? updatedUser : u
      )
      await window.spark.kv.set('users', updatedUsers)

      const targetScreen = role === 'admin' ? 'admin-dashboard' : 'courier-dashboard'
      onNavigate(targetScreen)
      
    } catch (error) {
      console.error('Error handling company click:', error)
      toast.error('Gagal membuka perusahaan')
    }
  }

  const handleOpenAdminDashboard = () => {
    if (!activeUserHasMemberships) {
      toast.error('Anda belum terdaftar di perusahaan mana pun sebagai admin.')
      return
    }
    onNavigate('admin-dashboard')
  }

  const handleOpenCourierDashboard = () => {
    if (!activeUserHasMemberships) {
      toast.error('Anda belum terdaftar di perusahaan mana pun sebagai kurir.')
      return
    }
    onNavigate('courier-dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm text-slate-500">Akun</div>
                <div className="font-semibold text-slate-900">
                  {user.name || user.email}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => onNavigate('home')}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-100 text-slate-900 font-medium flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Home
            </button>

            {/* Company List - Tampilkan semua perusahaan user */}
            {(companies || []).length > 0 && activeUserMemberships.map(membership => {
              const company = (companies || []).find(c => c.id === membership.companyId)
              if (!company) return null

              return (
                <button
                  key={company.id}
                  onClick={() => handleCompanyClick(company.id, membership.role)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate font-medium">{company.name}</span>
                </button>
              )
            })}

            <button
              onClick={handleTrackPackage}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2"
            >
              <PackageSearch className="h-4 w-4" />
              Cek Paket
            </button>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="w-full text-left text-sm text-red-500 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto py-10 px-8">
            {/* Header */}
            <header className="mb-10">
              <p className="text-sm text-slate-500 mb-1">
                Halo,{' '}
                <span className="font-semibold text-slate-800">
                  {user.name || user.email}
                </span>
              </p>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Selamat datang kembali di RouteOptima
              </h1>
              <p className="text-slate-500 max-w-2xl">
                Kelola perusahaan, pesanan, dan pengiriman Anda dari satu
                tempat. Pilih peran yang sesuai atau mulai buat perusahaan baru.
              </p>
            </header>

            {/* Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Buat Perusahaan */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Buat Perusahaan
                    </h2>
                  </div>
                  <p className="text-slate-500 mb-4">
                    Buat perusahaan dan kelola bisnis Anda. Tambahkan admin dan
                    kurir untuk membantu operasional.
                  </p>
                </div>
                <button
                  onClick={handleCreateCompany}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                >
                  Mulai Buat
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>

              {/* Gabung Perusahaan */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-sky-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Gabung Perusahaan
                    </h2>
                  </div>
                  <p className="text-slate-500 mb-4">
                    Bergabung sebagai admin atau kurir dengan menggunakan kode
                    undangan dari pemilik perusahaan.
                  </p>
                </div>
                <button
                  onClick={handleJoinCompany}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Gabung Sekarang
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </section>

            {/* Customer Mode */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Mode Customer
                    </h2>
                    <p className="text-slate-500">
                      Lacak dan kelola pesanan Anda sebagai customer.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCustomerMode}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Masuk sebagai Customer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </section>

            {/* Role shortcuts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Masuk sebagai Admin
                  </h3>
                  <p className="text-slate-200 mb-4">
                    Kelola perusahaan, kurir, dan pesanan. Cocok untuk pemilik
                    bisnis dan manajer operasional.
                  </p>
                  <p className="text-xs text-slate-400">
                    Membership yang terdeteksi: {userCompaniesFound}
                  </p>
                </div>
                <button
                  onClick={handleOpenAdminDashboard}
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-900 font-medium hover:bg-slate-100"
                >
                  Buka Admin Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Masuk sebagai Kurir
                  </h3>
                  <p className="text-slate-200 mb-4">
                    Lihat tugas pengantaran, perbarui status pengiriman, dan
                    kelola rute harian Anda.
                  </p>
                  <p className="text-xs text-slate-400">
                    Membership yang terdeteksi: {userCompaniesFound}
                  </p>
                </div>
                <button
                  onClick={handleOpenCourierDashboard}
                  className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-900 font-medium hover:bg-slate-100"
                >
                  Buka Courier Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}