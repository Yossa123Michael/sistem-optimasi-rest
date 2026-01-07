import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { User, Package, Courier } from '@/lib/types'
import CourierSidebar from './CourierSidebar'
import CourierHomeView from './CourierHomeView'
import CourierPackageListView from './CourierPackageListView'
import CourierRecommendationView from './CourierRecommendationView'
import CourierUpdateView from './CourierUpdateView'

type CourierView = 'home' | 'package-list' | 'recommendation' | 'update'

interface CourierDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
  onUpdatePackageStatus: (id: string, status: Package['status']) => void
  allPackages: Package[]
}

export default function CourierDashboard({
  user,
  onLogout,
  onBackToHome,
  onUpdatePackageStatus,
  allPackages,
}: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')
  const [courier, setCourier] = useState<Courier | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        if (!user.companyId) {
          console.log('CourierDashboard: user has no companyId')
          toast.error('Perusahaan tidak ditemukan untuk akun kurir ini')
          setCourier(null)
          setPackages([])
          return
        }

        // 1. Cari dokumen courier untuk user & perusahaan ini
        const couriersRef = collection(db, 'couriers')
        const courierQuery = query(
          couriersRef,
          where('userId', '==', user.id),
          where('companyId', '==', user.companyId),
        )
        const courierSnap = await getDocs(courierQuery)

        if (courierSnap.empty) {
          console.log(
            'CourierDashboard: courier not found for user',
            user.id,
            'company',
            user.companyId,
          )
          toast.error('Data kurir tidak ditemukan untuk perusahaan ini')
          setCourier(null)
          setPackages([])
          return
        }

        const courierDoc = courierSnap.docs[0]
        const courierData = {
          id: courierDoc.id,
          ...(courierDoc.data() as Courier),
        }
        setCourier(courierData)

        // 2. Ambil paket untuk courier ini
        const packagesRef = collection(db, 'packages')
        const packagesQuery = query(
          packagesRef,
          where('companyId', '==', user.companyId),
          where('courierId', '==', courierDoc.id),
        )
        const packagesSnap = await getDocs(packagesQuery)

        const loadedPackages: Package[] =
          packagesSnap.docs.map(d => ({
            id: d.id,
            ...(d.data() as DocumentData),
          })) || []

        setPackages(loadedPackages)
        console.log(
          'CourierDashboard: loaded packages for courier:',
          loadedPackages.length,
        )
      } catch (err) {
        console.error('CourierDashboard: error loading data', err)
        toast.error('Gagal memuat data kurir dan paket')
        setCourier(null)
        setPackages([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id, user.companyId])

  const total = packages.length
  const completed = packages.filter(p => p.status === 'delivered').length
  const remaining = total - completed

  const handleUpdateStatus = (id: string, newStatus: Package['status']) => {
  const now = new Date().toISOString()

  // 1. Update lokal (supaya kurir langsung lihat perubahan)
  setPackages(prev =>
    prev.map(p =>
      p.id === id
        ? {
            ...p,
            status: newStatus,
            updatedAt: now,
            deliveredAt:
              newStatus === 'delivered' ? now : p.deliveredAt,
          }
        : p,
    ),
  )

  // 2. Beritahu App supaya state global packages ikut berubah
  onUpdatePackageStatus(id, newStatus)

  // 3. (Opsional) nanti bisa tambahkan update ke Firestore di sini
}
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat dashboard kurir...</p>
        </div>
      </div>
    )
  }

  if (!courier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Data kurir tidak ditemukan untuk akun ini.
          </p>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
            >
              Kembali ke Home
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <CourierHomeView
            user={user}
            packages={packages}
            total={total}
            completed={completed}
            remaining={remaining}
          />
        )
      case 'package-list':
        return (
          <CourierPackageListView
            user={user}
            packages={packages}
            total={total}
            completed={completed}
            remaining={remaining}
          />
        )
      case 'recommendation':
        return (
          <CourierRecommendationView
            user={user}
            packages={packages}
          />
        )
      case 'update':
        return (
          <CourierUpdateView
            user={user}
            packages={packages}
            total={total}
            completed={completed}
            remaining={remaining}
            onUpdateStatus={handleUpdateStatus}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CourierSidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}