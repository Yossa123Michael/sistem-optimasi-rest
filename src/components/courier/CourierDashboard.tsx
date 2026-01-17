import { useState } from 'react'
import { User } from '@/lib/types'
import CourierSidebar from './CourierSidebar'
import CourierHomeView from './CourierHomeView'
import CourierRecommendationView from './CourierRecommendationView'
import CourierUpdateView from './CourierUpdateView'
import CourierHistoryView from './CourierHistoryView'
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { toast } from 'sonner'

type CourierView = 'home' | 'recommendation' | 'update' | 'history'

interface CourierDashboardProps {
  user: User
  onLogout: () => void
  onBackToHome?: () => void
  // legacy props from old code: keep to avoid App.tsx mismatch
  onUpdatePackageStatus?: any
  allPackages?: any
}

export default function CourierDashboard({ user, onLogout, onBackToHome }: CourierDashboardProps) {
  const [currentView, setCurrentView] = useState<CourierView>('home')
  const [companies] = useKV<Company[]>('companies', [])
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    if (!user.companyId) {
      console.log('CourierDashboard: User does not have companyId, waiting...')
      return
    }
    
    const companyExists = (companies || []).some(c => c.id === user.companyId)
    if (!companyExists) {
      console.log('CourierDashboard: Company does not exist')
      if (onBackToHome) onBackToHome()
      return
    }
    
    console.log('CourierDashboard: Ready to render')
    setIsReady(true)
  }, [user.companyId, companies, onBackToHome])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'recommendation':
        return <CourierRecommendationView user={user} />
      case 'update':
        return <CourierUpdateView user={user} />
      case 'history':
        return <CourierHistoryView user={user} />
      case 'home':
      default:
        return <CourierHomeView user={user} onGoRecommendation={() => setCurrentView('recommendation')} />
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
        onLeaveCompany={leaveCompany}
      />
      <main className="flex-1 lg:ml-48">{renderView()}</main>
    </div>
  )
}