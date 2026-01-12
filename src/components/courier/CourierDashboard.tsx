import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  updateDoc,
  doc,
  orderBy,
  limit,
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
}: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')
  const [courier, setCourier] = useState<Courier | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [myRoute, setMyRoute] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        if (!user.companyId) {
          toast.error('Perusahaan tidak ditemukan untuk akun kurir ini')
          setCourier(null)
          setPackages([])
          return
        }

        // 1) cari courier doc
        const couriersRef = collection(db, 'couriers')
        const courierQuery = query(
          couriersRef,
          where('userId', '==', user.id),
          where('companyId', '==', user.companyId),
        )
        const courierSnap = await getDocs(courierQuery)

        if (courierSnap.empty) {
          toast.error('Data kurir tidak ditemukan untuk perusahaan ini')
          setCourier(null)
          setPackages([])
          return
        }

        const courierDoc = courierSnap.docs[0]
        const courierData: Courier = {
          id: courierDoc.id,
          ...(courierDoc.data() as Courier),
        }
        setCourier(courierData)

        // 2) ambil paket untuk courier ini
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

        // 3) load route terbaru untuk kurir ini
        try {
          const runsQ = query(
            collection(db, 'routeOptimizations'),
            where('companyId', '==', user.companyId),
            orderBy('createdAt', 'desc'),
            limit(1),
          )
          const runsSnap = await getDocs(runsQ)

          if (!runsSnap.empty) {
            const runId = runsSnap.docs[0].id
            const routesQ = query(
              collection(db, 'routeOptimizations', runId, 'courierRoutes'),
              where('courierId', '==', courierDoc.id),
              limit(1),
            )
            const routesSnap = await getDocs(routesQ)

            if (!routesSnap.empty) {
              const data = routesSnap.docs[0].data() as any
              setMyRoute((data.packageIds || []) as string[])
            } else {
              setMyRoute([])
            }
          } else {
            setMyRoute([])
          }
        } catch (e) {
          console.error('Gagal load route terbaru kurir', e)
          setMyRoute([])
        }
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

  const handleUpdateStatus = async (id: string, newStatus: Package['status']) => {
    const now = new Date().toISOString()

    setPackages(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              status: newStatus,
              updatedAt: now,
              deliveredAt: newStatus === 'delivered' ? now : p.deliveredAt,
            }
          : p,
      ),
    )

    onUpdatePackageStatus(id, newStatus)

    try {
      await updateDoc(doc(db, 'packages', id), {
        status: newStatus,
        updatedAt: now,
        deliveredAt: newStatus === 'delivered' ? now : null,
      })
    } catch (err) {
      console.error('Gagal update status paket di Firestore', err)
      toast.error('Gagal menyimpan status paket ke server')
    }
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
            myRoute={myRoute}
            total={total}
            completed={completed}
            remaining={remaining}
          />
        )
      case 'recommendation':
        return <CourierRecommendationView user={user} packages={packages} />
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