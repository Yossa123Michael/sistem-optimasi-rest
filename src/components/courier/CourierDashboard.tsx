import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { User, Company } from '@/lib/types'
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
}

export default function CourierDashboard({
  user,
  onLogout,
  onBackToHome,
}: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')
  const [company, setCompany] = useState<Company | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!user.companyId) {
        console.log('CourierDashboard: User does not have companyId, waiting...')
        setIsReady(false)
        return
      }

      try {
        const ref = doc(db, 'companies', user.companyId)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          console.log('CourierDashboard: Company does not exist')
          toast.error('Perusahaan tidak ditemukan')
          if (onBackToHome) onBackToHome()
          return
        }

        setCompany({ id: snap.id, ...(snap.data() as Company) })
        console.log('CourierDashboard: Ready to render')
        setIsReady(true)
      } catch (err) {
        console.error('CourierDashboard: error loading company', err)
        toast.error('Gagal memuat data perusahaan')
        if (onBackToHome) onBackToHome()
      }
    }

    init()
  }, [user.companyId, onBackToHome])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <CourierHomeView user={user} company={company!} />
      case 'package-list':
        return <CourierPackageListView user={user} company={company!} />
      case 'recommendation':
        return <CourierRecommendationView user={user} company={company!} />
      case 'update':
        return <CourierUpdateView user={user} company={company!} />
      default:
        return <CourierHomeView user={user} company={company!} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CourierSidebar
        user={user}
        company={company!}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}