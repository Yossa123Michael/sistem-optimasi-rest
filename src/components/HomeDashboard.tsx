import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Building2,
  PackageSearch,
  Truck,
  Users,
  ArrowRight,
} from 'lucide-react'
import { User, Company } from '@/lib/types'

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
  onUserUpdate?: (user: User) => void
  onCompaniesLoaded?: (companies: Company[]) => void
}

export default function HomeDashboard({
  user,
  onLogout,
  onNavigate,
  refreshKey,
  onUserUpdate,
  onCompaniesLoaded,
}: HomeDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // ====== LOAD DATA PERUSAHAAN DARI FIRESTORE ======
  const loadData = async () => {
    try {
      setLoading(true)

      const snapshot = await getDocs(collection(db, 'companies'))

      const companiesFromFirestore: Company[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Company),
      }))

      console.log(
        'HomeDashboard loadData - Companies from Firestore:',
        companiesFromFirestore.length,
      )

      setCompanies(companiesFromFirestore)

      if (onCompaniesLoaded) {
        onCompaniesLoaded(companiesFromFirestore)
      }
    } catch (err) {
      console.error('Error loading data in HomeDashboard:', err)
      toast.error('Gagal memuat data perusahaan')
    } finally {
      setLoading(false)
    }
  }

    useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // Perusahaan tempat user menjadi anggota (bukan owner)
  const memberCompanies = useMemo(() => {
    const ids = new Set((user.companies || []).map(m => m.companyId))
    const result = companies.filter(c => ids.has(c.id))
    console.log('HomeDashboard memberCompanies:', result.map(c => c.name))
    return result
  }, [companies, user.companies])

  // ====== PERUSAHAAN YANG DIMILIKI USER (ownerId === user.id) ======
  const ownedCompanies = useMemo(() => {
    const list = companies.filter(c => c.ownerId === user.id)
    console.log('HomeDashboard ownedCompanies:', list.map(c => c.name))
    return list
  }, [companies, user.id])

  const ownedCount = ownedCompanies.length

  // ====== HANDLER NAVIGASI ======
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

  const handleCompanyClick = async (
    companyId: string,
    role: 'admin' | 'courier' | 'customer',
  ) => {
    try {
      const company = companies.find(c => c.id === companyId)

      if (!company) {
        toast.error('Perusahaan tidak ditemukan')
        return
      }

      const updatedUser: User = {
        ...user,
        companyId,
        role,
      }

      console.log('handleCompanyClick - updatedUser:', updatedUser)
      onUserUpdate?.(updatedUser)

      const targetScreen =
        role === 'admin'
          ? 'admin-dashboard'
          : role === 'courier'
          ? 'courier-dashboard'
          : 'home-dashboard'

      onNavigate(targetScreen)
    } catch (error) {
      console.error('Error handling company click:', error)
      toast.error('Gagal membuka perusahaan')
    }
  }

  const handleOpenAdminDashboard = () => {
    if (!ownedCompanies.length) {
      toast.error('Anda belum memiliki perusahaan sebagai admin (owner).')
      return
    }
    // pakai perusahaan pertama sebagai default
    const company = ownedCompanies[0]
    handleCompanyClick(company.id, 'admin')
  }

  const handleOpenCourierDashboard = () => {
    // untuk sementara: belum ada logika kurir, tetap pakai perusahaan pertama
    if (!ownedCompanies.length) {
      toast.error('Anda belum terdaftar di perusahaan mana pun sebagai kurir.')
      return
    }
    const company = ownedCompanies[0]
    handleCompanyClick(company.id, 'courier')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  console.log('=== HomeDashboard RENDER ===')
  console.log('Owned companies:', ownedCompanies.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold">
                {user.name?.[0]?.toUpperCase() ||
                  user.email[0].toUpperCase()}
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

            {/* Company List - semua perusahaan yang dimiliki user */}
            {ownedCompanies.map(company => (
              <button
                key={company.id}
                onClick={() => handleCompanyClick(company.id, 'admin')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors"
              >
                <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate font-medium">
                  {company.name}
                </span>
              </button>
            ))}

            {/* Perusahaan tempat user bekerja (courier/admin non-owner) */}
            {memberCompanies.length > 0 && (
              <>
                <div className="mt-4 mb-1 text-xs text-slate-400 px-3">
                  Perusahaan tempat kamu bekerja
                </div>
                {memberCompanies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanyClick(company.id, 'courier')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-sky-600 flex-shrink-0" />
                    <span className="truncate font-medium">
                      {company.name}
                    </span>
                  </button>
                ))}
              </>
            )}

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

        {/* Main content (tetap sama seperti versi kamu, hanya pakai ownedCount) */}
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
                    <h3 className="text-lg font-semibold text-slate-900">
                      Mode Customer
                    </h3>
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
                    Perusahaan yang kamu miliki: {ownedCount}
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
                    Perusahaan yang kamu miliki: {ownedCount}
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