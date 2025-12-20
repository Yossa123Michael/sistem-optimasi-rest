import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
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
      case 'home':
        return <CourierHomeView user={user} />
      case 'package-list':
        return <CourierPackageListView user={user} />
      case 'recommendation':
        return <CourierRecommendationView user={user} />
      case 'update':
        return <CourierUpdateView user={user} />
      default:
        return <CourierHomeView user={user} />
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
      <main className="flex-1 lg:ml-48">
        {renderView()}
      </main>
    </div>
  )
}
