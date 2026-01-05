import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
import { Building2, ArrowLeft, LogOut } from 'lucide-react'

interface AdminDashboardProps {
  user: User
  companyId: string
  role: 'admin' | 'courier' | 'customer'
  onLogout: () => void
  onBackToHome: () => void
}

export default function AdminDashboard({
  user,
  companyId,
  role,
  onLogout,
  onBackToHome,
}: AdminDashboardProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCompany = async () => {
      try {
        if (!companyId) {
          console.log('AdminDashboard: no companyId in props')
          setLoading(false)
          return
        }

        setLoading(true)

        const ref = doc(db, 'companies', companyId)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          console.log('AdminDashboard: Company does not exist')
          toast.error('Perusahaan tidak ditemukan')
          setCompany(null)
          setLoading(false)
          return
        }

        const data = snap.data() as Company
        setCompany({ ...data, id: snap.id })
      } catch (err) {
        console.error('AdminDashboard: error loading company', err)
        toast.error('Gagal memuat data perusahaan')
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [companyId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground mb-4">
          Data perusahaan tidak ditemukan.
        </p>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Home
        </button>
      </div>
    )
  }

  // Dashboard admin sederhana – silakan lanjutkan sesuai kebutuhanmu
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
                <p className="font-semibold text-slate-900">{company.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                Role: {role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Selamat datang, Admin
        </h1>
        <p className="text-slate-500 mb-8">
          Kelola perusahaan <span className="font-semibold">{company.name}</span>{' '}
          dari satu tempat.
        </p>

        {/* Di sini kamu bisa tambah kartu statistik, daftar kurir, pesanan, dsb */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">ID Perusahaan</p>
            <p className="text-sm font-mono text-slate-800 break-all">
              {company.id}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Kode Undangan</p>
            <p className="text-lg font-semibold text-slate-900">
              {company.code}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Owner</p>
            <p className="text-sm text-slate-900">{company.ownerId}</p>
          </div>
        </div>
      </main>
    </div>
  )
}