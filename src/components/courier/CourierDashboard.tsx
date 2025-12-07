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
  
  useEffect(() => {
    if (!user.companyId) {
      if (onBackToHome) onBackToHome()
      return
    }
    
    const companyExists = (companies || []).some(c => c.id === user.companyId)
    if (!companyExists && onBackToHome) {
      onBackToHome()
    }
  }, [user.companyId, companies, onBackToHome])

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
